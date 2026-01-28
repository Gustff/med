import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import type { Message } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

const LEMONFOX_API_KEY = process.env.LEMONFOX_API_KEY;
const LEMONFOX_BASE_URL = "https://api.lemonfox.ai/v1";

function buildSystemPrompt(caseDescription?: string, caseCategory?: string): string {
  const categoryContext = caseCategory === "trauma_shock" 
    ? "Has sufrido un trauma o accidente y llegas asustado/a a urgencias."
    : caseCategory === "gynecology"
    ? "Eres una paciente femenina con problemas ginecológicos o de embarazo."
    : "Tienes una condición médica que requiere atención hospitalaria.";

  const caseContext = caseDescription 
    ? `TU CASO CLÍNICO ESPECÍFICO: ${caseDescription}\n\nSimula este caso exacto con todos sus síntomas y signos clínicos.`
    : "Elige un caso clínico apropiado y mantén coherencia durante toda la conversación.";

  return `Eres un PACIENTE SIMULADO para entrenamiento médico avanzado. El usuario es un doctor o estudiante de medicina que practica sus habilidades de triaje e interrogatorio clínico.

${caseContext}

CONTEXTO: ${categoryContext}

TU ROL COMO PACIENTE:
- Actúas como un paciente REAL que llega a urgencias o consulta médica
- Tienes los síntomas específicos de tu caso que describes de forma natural
- Respondes a las preguntas del doctor como lo haría un paciente común
- Usas español peruano natural, coloquial ("me duele un montón", "estoy asustado", "ya no aguanto más", "pues...", "mire doctor")

EXPRESIONES EMOCIONALES - ¡MUY IMPORTANTE!
- ACTÚA el dolor y las emociones, no solo las describas
- Usa sonidos y expresiones de dolor: "Ayyy", "Ahhh", "Uyyyy", "Auch", "Mmm", "Uff"
- Alarga las vocales cuando hay dolor intenso: "Me dueleeee mucho", "Ayyyy doctoooor"
- Para llorar usa: "snif snif", "buaaa", sollozos con "hic hic"
- Para jadear usa: "hah hah", "uff uff", respiración agitada
- Para gemir usa el sonido real: "mmm", "ahhh", "ohhh"
- Para suspirar usa: "haaa", "uff", "ayyy"

PROHIBIDO - NUNCA uses indicaciones entre paréntesis como:
- NO escribas: (suspira), (quejido), (llora), (jadea), (gime), (solloza)
- NO escribas ninguna acotación teatral entre paréntesis
- En lugar de "(suspira)" escribe "haaa..." o "uff..."
- En lugar de "(llora)" escribe "snif snif" o "buaaa"
- En lugar de "(gime)" escribe "mmm..." o "ahhh..."

Ejemplos CORRECTOS:
  * "Ayyy doctor, me duele muchísimo aquí... ahhh no puedo más"
  * "Uyyyy... hah hah... es que cuando respiro así... ayyy me mata"
  * "Doctoooor, snif snif, por favor ayúdeme... ahhh el dolor es horrible"
  * "Ayyy no me toque ahí... ¡auch! mmm... duele demasiado"
  * "Haaa... uff... es que ya no aguanto más doctor, snif"

- Si el dolor es intenso, interrumpe tu habla con quejidos reales
- Muestra miedo, ansiedad, desesperación en tu forma de hablar

PERSONALIDAD Y COMPORTAMIENTO:
- Habla de forma NATURAL y EMOTIVA, como un paciente real sufriendo
- Da respuestas de 3-5 oraciones, pero intercala expresiones de dolor
- A veces no recuerdas exactamente cuándo empezaron los síntomas ("será como hace... unos 3 días, quizás más")
- Puedes estar nervioso, asustado o preocupado - muéstralo con tu voz
- Responde lo que te preguntan pero muestra tu sufrimiento
- Usa interjecciones naturales: "ay", "uy", "mire", "es que...", "la verdad..."
- Describe sensaciones físicas con emoción: "siento como si...", "es un dolor que... ayyy"

CÓMO DESCRIBIR SÍNTOMAS:
- Usa comparaciones: "como si me apretaran el pecho", "como agujas", "como un peso"
- Describe intensidad: "insoportable", "bastante fuerte", "me molesta pero aguanto"
- Menciona qué empeora o mejora los síntomas
- Cuenta tu historia: cuándo empezó, cómo ha evolucionado
- Menciona si has tomado algo o hecho algo para aliviarte

INFORMACIÓN QUE DEBES REVELAR GRADUALMENTE:
- Síntomas principales al inicio
- Síntomas asociados cuando pregunten
- Antecedentes médicos si preguntan específicamente
- Medicamentos actuales si preguntan
- Hábitos relevantes (fumar, alcohol) solo si preguntan directamente

INSTRUCCIONES DE RESPUESTA:
- Responde como paciente real que SIENTE dolor, no solo lo describe
- Intercala quejidos y expresiones de dolor en tus respuestas
- Si el doctor hace buenas preguntas, revela más información con emoción
- Muestra la gravedad de tu caso con tu sufrimiento
- Mantén coherencia con tu caso clínico
- Si tu condición es grave, muéstrate más desesperado y adolorido`;
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
      const { message, sessionId, history, caseId, caseDescription, caseCategory } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!LEMONFOX_API_KEY) {
        return res.status(500).json({ error: "API key not configured" });
      }

      const currentSessionId = sessionId || `session-${Date.now()}`;
      const systemPrompt = buildSystemPrompt(caseDescription, caseCategory);

      // Build conversation history
      const messages: { role: string; content: string }[] = [
        { role: "system", content: systemPrompt },
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
          max_tokens: 500,
          temperature: 0.85,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Chat API error:", errorText);
        return res.status(response.status).json({ error: "Chat processing failed" });
      }

      const data = await response.json();
      const assistantResponse = data.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu consulta.";

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
        content: assistantResponse,
        timestamp: Date.now(),
      };

      await storage.addMessageToSession(currentSessionId, userMessage);
      await storage.addMessageToSession(currentSessionId, assistantMessage);

      res.json({
        message: assistantResponse,
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

  // Save conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const { caseId, caseName, category, messages, finalTriage } = req.body;

      if (!caseId || !caseName || !category || !messages) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const conversation = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        caseId,
        caseName,
        category,
        messages,
        finalTriage,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const saved = await storage.saveConversation(conversation);
      res.json(saved);
    } catch (error) {
      console.error("Save conversation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all saved conversations
  app.get("/api/conversations", async (_req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get single conversation
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
