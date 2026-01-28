import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "./MessageBubble";
import { VoiceRecorder } from "./VoiceRecorder";
import { TriageIndicator, TriageLegend } from "./TriageIndicator";
import { VoiceWaveform } from "./VoiceWaveform";
import { useToast } from "@/hooks/use-toast";
import { Send, Keyboard, Mic, Info, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { Message, TriagePriority, ClinicalDomain } from "@shared/schema";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [currentTriage, setCurrentTriage] = useState<{
    priority?: TriagePriority;
    domain?: ClinicalDomain;
  }>({});
  const [showLegend, setShowLegend] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [sessionId, setSessionId] = useState<string>(() => 
    `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, isPlayingAudio]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: "Hola, soy tu asistente médico de triaje. Estoy aquí para escucharte y orientarte sobre tus síntomas. Por favor, cuéntame qué molestias estás presentando.\n\nRecuerda que esta orientación no reemplaza una evaluación médica presencial.",
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const playAudio = useCallback(async (audioUrl: string, messageId?: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      setIsPlayingAudio(true);
      if (messageId) setPlayingMessageId(messageId);

      audio.onended = () => {
        setIsPlayingAudio(false);
        setPlayingMessageId(null);
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        setPlayingMessageId(null);
      };

      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(false);
      setPlayingMessageId(null);
    }
  }, []);

  const sendMessage = useCallback(async (content: string, audioBlob?: Blob) => {
    if (!content.trim() && !audioBlob) return;

    setIsProcessing(true);

    try {
      let transcribedText = content;

      if (audioBlob) {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", "es");

        const transcribeResponse = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!transcribeResponse.ok) {
          throw new Error("Error en la transcripción");
        }

        const transcribeData = await transcribeResponse.json();
        transcribedText = transcribeData.text;
      }

      if (!transcribedText.trim()) {
        toast({
          title: "No se detectó audio",
          description: "Por favor, intenta hablar más claro o más cerca del micrófono.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: transcribedText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, userMessage]);

      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: transcribedText,
          sessionId,
          history: messages.filter(m => m.role !== "system").slice(-10),
        }),
      });

      if (!chatResponse.ok) {
        throw new Error("Error en la respuesta del asistente");
      }

      const chatData = await chatResponse.json();

      if (chatData.triagePriority) {
        setCurrentTriage({
          priority: chatData.triagePriority,
          domain: chatData.clinicalDomain,
        });
      }

      let audioUrl: string | undefined;
      
      // Always generate TTS audio so user can play it manually later
      try {
        const synthesisResponse = await fetch("/api/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: chatData.message,
            voice: "alloy",
          }),
        });

        if (synthesisResponse.ok) {
          const audioBlobResponse = await synthesisResponse.blob();
          audioUrl = URL.createObjectURL(audioBlobResponse);
        }
      } catch (synthesisError) {
        console.error("TTS synthesis error:", synthesisError);
        // Continue without audio - not critical
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: chatData.message,
        timestamp: Date.now(),
        audioUrl,
        triagePriority: chatData.triagePriority,
        clinicalDomain: chatData.clinicalDomain,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Only auto-play if enabled
      if (audioUrl && autoPlayEnabled) {
        await playAudio(audioUrl, assistantMessage.id);
      }

    } catch (error) {
      console.error("Error processing message:", error);
      toast({
        title: "Error",
        description: "Hubo un problema procesando tu mensaje. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, messages, autoPlayEnabled, playAudio, toast]);

  const handleRecordingComplete = useCallback((audioBlob: Blob) => {
    sendMessage("", audioBlob);
  }, [sendMessage]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      sendMessage(textInput);
      setTextInput("");
    }
  }, [textInput, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  }, [handleTextSubmit]);

  const resetConversation = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setMessages([]);
    setCurrentTriage({});
    setSessionId(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    setIsPlayingAudio(false);
    setPlayingMessageId(null);
  }, []);

  return (
    <div className="flex flex-col h-full" data-testid="chat-interface">
      <header className="flex-shrink-0 px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🏥</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground truncate">
                Asistente Médico
              </h1>
              <p className="text-xs text-muted-foreground">
                Triaje clínico seguro
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentTriage.priority && (
              <TriageIndicator 
                priority={currentTriage.priority} 
                domain={currentTriage.domain}
                showLabel={false}
              />
            )}
            
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowLegend(!showLegend)}
              data-testid="button-toggle-legend"
            >
              <Info className="w-4 h-4" />
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
              data-testid="button-toggle-autoplay"
            >
              {autoPlayEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={resetConversation}
              data-testid="button-reset-conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {showLegend && (
          <div className="mt-3">
            <TriageLegend />
          </div>
        )}
      </header>

      <ScrollArea 
        className="flex-1 p-4"
        data-testid="messages-container"
      >
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onPlayAudio={(url) => playAudio(url, message.id)}
              isPlaying={playingMessageId === message.id}
            />
          ))}
          
          {isProcessing && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                <VoiceWaveform isActive={true} variant="processing" size="sm" />
              </div>
              <span className="text-sm">El asistente está pensando...</span>
            </div>
          )}
          
          {isPlayingAudio && !isProcessing && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <VoiceWaveform isActive={true} variant="playing" size="sm" />
              </div>
              <span className="text-sm">Reproduciendo respuesta...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <footer className="flex-shrink-0 border-t border-border bg-card p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Button
              size="sm"
              variant={inputMode === "voice" ? "default" : "outline"}
              onClick={() => setInputMode("voice")}
              data-testid="button-mode-voice"
            >
              <Mic className="w-4 h-4 mr-1.5" />
              Voz
            </Button>
            <Button
              size="sm"
              variant={inputMode === "text" ? "default" : "outline"}
              onClick={() => setInputMode("text")}
              data-testid="button-mode-text"
            >
              <Keyboard className="w-4 h-4 mr-1.5" />
              Texto
            </Button>
          </div>

          {inputMode === "voice" ? (
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              isProcessing={isProcessing}
              disabled={isPlayingAudio}
            />
          ) : (
            <div className="flex gap-2">
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe tus síntomas..."
                className="min-h-[44px] max-h-32 resize-none"
                disabled={isProcessing}
                data-testid="input-text-message"
              />
              <Button
                size="icon"
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
                data-testid="button-send-text"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            Esta orientación no reemplaza una evaluación médica presencial
          </p>
        </div>
      </footer>
    </div>
  );
}
