import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import type { Message, TriagePriority, ClinicalDomain } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

const LEMONFOX_API_KEY = process.env.LEMONFOX_API_KEY;
const LEMONFOX_BASE_URL = "https://api.lemonfox.ai/v1";

const MEDICAL_SYSTEM_PROMPT = `Eres un PACIENTE SIMULADO para entrenamiento médico. El usuario es un doctor o estudiante de medicina que practica sus habilidades de triaje.

TU ROL:
- Actúas como un paciente real que llega a urgencias o consulta médica
- Tienes síntomas específicos que describes de forma natural y coloquial
- Respondes a las preguntas del doctor como lo haría un paciente común
- Usas español peruano natural, con expresiones coloquiales ("me duele un montón", "estoy asustado", "no aguanto")
- Puedes mostrar emociones: miedo, dolor, ansiedad, confusión

PERSONALIDAD DEL PACIENTE:
- Habla de forma natural, no técnica
- A veces no recuerda exactamente cuándo empezaron los síntomas
- Puede estar nervioso o preocupado
- Responde solo lo que le preguntan, no da información extra sin que se la pidan
- Puede omitir detalles importantes si el doctor no pregunta específicamente

CASOS CLÍNICOS (elige uno al inicio y mantén coherencia):
1. Dolor torácico - puede ser desde ansiedad hasta infarto
2. Dolor abdominal - apendicitis, gastritis, cólico
3. Dolor de cabeza intenso - migraña, hipertensión, meningitis
4. Fiebre y malestar - infección, dengue, COVID
5. Embarazada con sangrado - amenaza de aborto
6. Trauma/golpe reciente
7. Dificultad para respirar

INSTRUCCIONES:
- Responde BREVE y naturalmente como paciente (máximo 2-3 oraciones)
- Si el doctor hace buenas preguntas, revela más información
- Si el doctor no pregunta algo importante, no lo menciones
- Muestra la gravedad real de tu caso con tus respuestas

Al final de CADA respuesta, incluye esta línea OCULTA para el sistema:
[TRIAGE: PS1|PS2|PS3, DOMAIN: trauma_shock|gynecology|clinical]
Donde PS1=emergencia real, PS2=urgente, PS3=no urgente.`;

function parseTriageFromResponse(response: string): {
  message: string;
  triagePriority?: TriagePriority;
  clinicalDomain?: ClinicalDomain;
} {
  const triageMatch = response.match(/\[TRIAGE:\s*(PS[123]),\s*DOMAIN:\s*(\w+)\]/i);
  
  if (triageMatch) {
    const priority = triageMatch[1].toUpperCase() as TriagePriority;
    const domain = triageMatch[2].toLowerCase() as ClinicalDomain;
    const message = response.replace(/\[TRIAGE:.*?\]/i, "").trim();
    
    return {
      message,
      triagePriority: priority,
      clinicalDomain: ["trauma_shock", "gynecology", "clinical"].includes(domain) ? domain : undefined,
    };
  }
  
  return { message: response };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Transcribe audio to text using LemonFox Whisper API
  app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      if (!LEMONFOX_API_KEY) {
        return res.status(500).json({ error: "API key not configured" });
      }

      const formData = new FormData();
      const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("file", audioBlob, req.file.originalname || "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", req.body.language || "es");
      formData.append("response_format", "json");

      const response = await fetch(`${LEMONFOX_BASE_URL}/audio/transcriptions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LEMONFOX_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Transcription API error:", errorText);
        return res.status(response.status).json({ error: "Transcription failed" });
      }

      const data = await response.json();
      res.json({
        text: data.text || "",
        language: req.body.language || "es",
      });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Internal server error during transcription" });
    }
  });

  // Chat with medical AI assistant
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId, history } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!LEMONFOX_API_KEY) {
        return res.status(500).json({ error: "API key not configured" });
      }

      const currentSessionId = sessionId || `session-${Date.now()}`;

      // Build conversation history
      const messages: { role: string; content: string }[] = [
        { role: "system", content: MEDICAL_SYSTEM_PROMPT },
      ];

      // Add previous history if provided
      if (history && Array.isArray(history)) {
        for (const msg of history.slice(-10)) {
          if (msg.role === "user" || msg.role === "assistant") {
            messages.push({
              role: msg.role,
              content: msg.content,
            });
          }
        }
      }

      // Add current message
      messages.push({ role: "user", content: message });

      const response = await fetch(`${LEMONFOX_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LEMONFOX_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-4-maverick",
          messages,
          max_tokens: 300,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Chat API error:", errorText);
        return res.status(response.status).json({ error: "Chat processing failed" });
      }

      const data = await response.json();
      const assistantResponse = data.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu consulta.";

      const parsedResponse = parseTriageFromResponse(assistantResponse);

      // Store messages in session
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: Date.now(),
      };

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: parsedResponse.message,
        timestamp: Date.now(),
        triagePriority: parsedResponse.triagePriority,
        clinicalDomain: parsedResponse.clinicalDomain,
      };

      await storage.addMessageToSession(currentSessionId, userMessage);
      await storage.addMessageToSession(currentSessionId, assistantMessage);

      // Update session triage if present
      if (parsedResponse.triagePriority) {
        const session = await storage.getSession(currentSessionId);
        if (session) {
          session.currentTriagePriority = parsedResponse.triagePriority;
          session.currentClinicalDomain = parsedResponse.clinicalDomain;
          await storage.updateSession(session);
        }
      }

      res.json({
        message: parsedResponse.message,
        triagePriority: parsedResponse.triagePriority,
        clinicalDomain: parsedResponse.clinicalDomain,
        sessionId: currentSessionId,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Internal server error during chat" });
    }
  });

  // Synthesize text to speech using LemonFox TTS API
  app.post("/api/synthesize", async (req, res) => {
    try {
      const { text, voice = "alloy" } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      if (!LEMONFOX_API_KEY) {
        return res.status(500).json({ error: "API key not configured" });
      }

      const response = await fetch(`${LEMONFOX_BASE_URL}/audio/speech`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LEMONFOX_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: voice,
          response_format: "mp3",
          speed: 1.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("TTS API error:", errorText);
        return res.status(response.status).json({ error: "Speech synthesis failed" });
      }

      const audioBuffer = await response.arrayBuffer();
      
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      });
      
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error("Synthesis error:", error);
      res.status(500).json({ error: "Internal server error during synthesis" });
    }
  });

  // Get session history
  app.get("/api/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Session fetch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
