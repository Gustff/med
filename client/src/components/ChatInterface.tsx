import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageBubble } from "./MessageBubble";
import { VoiceRecorder } from "./VoiceRecorder";
import { TriageIndicator, TriageLegend } from "./TriageIndicator";
import { VoiceWaveform } from "./VoiceWaveform";
import { useToast } from "@/hooks/use-toast";
import { Info, RotateCcw, Volume2, VolumeX, Stethoscope } from "lucide-react";
import type { Message, TriagePriority, ClinicalDomain } from "@shared/schema";

const VOICE_OPTIONS = [
  { value: "dora", label: "Dora", description: "Voz femenina cálida" },
  { value: "alex", label: "Alex", description: "Voz masculina natural" },
  { value: "noel", label: "Noel", description: "Voz neutral suave" },
] as const;

type VoiceOption = typeof VOICE_OPTIONS[number]["value"];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [currentTriage, setCurrentTriage] = useState<{
    priority?: TriagePriority;
    domain?: ClinicalDomain;
  }>({});
  const [showLegend, setShowLegend] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>("dora");
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
        content: "Hola doctor, buenas tardes. Vengo porque no me siento bien desde hace unos días y ya no aguanto más. ¿Me puede ayudar?",
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

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
        throw new Error("Error en la respuesta del paciente");
      }

      const chatData = await chatResponse.json();

      if (chatData.triagePriority) {
        setCurrentTriage({
          priority: chatData.triagePriority,
          domain: chatData.clinicalDomain,
        });
      }

      let audioUrl: string | undefined;
      
      // Always generate TTS audio
      try {
        const synthesisResponse = await fetch("/api/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: chatData.message,
            voice: selectedVoice,
          }),
        });

        if (synthesisResponse.ok) {
          const audioBlobResponse = await synthesisResponse.blob();
          audioUrl = URL.createObjectURL(audioBlobResponse);
        }
      } catch (synthesisError) {
        console.error("TTS synthesis error:", synthesisError);
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
  }, [sessionId, messages, autoPlayEnabled, selectedVoice, playAudio, toast]);

  const handleRecordingComplete = useCallback((audioBlob: Blob) => {
    sendMessage("", audioBlob);
  }, [sendMessage]);

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
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground truncate">
                Simulador de Paciente
              </h1>
              <p className="text-xs text-muted-foreground">
                Practica tu triaje clínico
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
              <span className="text-sm">El paciente está respondiendo...</span>
            </div>
          )}
          
          {isPlayingAudio && !isProcessing && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <VoiceWaveform isActive={true} variant="playing" size="sm" />
              </div>
              <span className="text-sm">Escuchando al paciente...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <footer className="flex-shrink-0 border-t border-border bg-card p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-xs text-muted-foreground">Voz del paciente:</span>
            <Select 
              value={selectedVoice} 
              onValueChange={(value) => setSelectedVoice(value as VoiceOption)}
            >
              <SelectTrigger 
                className="w-32 h-8 text-sm"
                data-testid="select-voice"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem 
                    key={voice.value} 
                    value={voice.value}
                    data-testid={`option-voice-${voice.value}`}
                  >
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isProcessing}
            disabled={isPlayingAudio}
          />
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            Habla como doctor para interrogar al paciente
          </p>
        </div>
      </footer>
    </div>
  );
}
