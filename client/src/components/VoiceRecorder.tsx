import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square, Loader2 } from "lucide-react";
import { VoiceWaveform } from "./VoiceWaveform";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  isProcessing = false,
  disabled = false 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setHasPermission(true);
      return stream;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setHasPermission(false);
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    let stream = streamRef.current;
    
    if (!stream) {
      stream = await requestPermission();
      if (!stream) return;
    }

    audioChunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
    });
    
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorder.mimeType 
      });
      onRecordingComplete(audioBlob);
    };

    mediaRecorder.start(100);
    setIsRecording(true);
    setRecordingDuration(0);
    
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  }, [onRecordingComplete, requestPermission]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const buttonDisabled = disabled || isProcessing;

  if (hasPermission === false) {
    return (
      <div 
        className="flex flex-col items-center gap-3 p-4"
        data-testid="voice-recorder-no-permission"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <MicOff className="w-7 h-7 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Se necesita acceso al micrófono para usar el chat por voz
        </p>
        <Button 
          variant="outline" 
          onClick={requestPermission}
          data-testid="button-request-mic-permission"
        >
          Permitir micrófono
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center gap-4"
      data-testid="voice-recorder"
    >
      {isRecording && (
        <div className="flex items-center gap-3">
          <VoiceWaveform isActive={true} variant="recording" size="md" />
          <span className="text-sm font-mono text-muted-foreground min-w-[3rem]">
            {formatDuration(recordingDuration)}
          </span>
        </div>
      )}
      
      {isProcessing && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Procesando...</span>
        </div>
      )}

      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse-ring" />
        )}
        
        <Button
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className={`
            relative w-16 h-16 rounded-full
            ${!isRecording && !buttonDisabled ? "bg-primary hover:bg-primary/90" : ""}
          `}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={buttonDisabled}
          data-testid={isRecording ? "button-stop-recording" : "button-start-recording"}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isRecording ? (
            <Square className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        {isRecording 
          ? "Suelta para enviar" 
          : isProcessing 
            ? "Procesando..." 
            : "Mantén para hablar"
        }
      </p>
    </div>
  );
}
