import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceWaveform } from "./VoiceWaveform";

interface ContinuousVoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing?: boolean;
  disabled?: boolean;
  isPlayingAudio?: boolean;
}

export function ContinuousVoiceRecorder({
  onRecordingComplete,
  isProcessing = false,
  disabled = false,
  isPlayingAudio = false,
}: ContinuousVoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speakingStartTimeRef = useRef<number | null>(null);

  const SILENCE_THRESHOLD = 25;
  const SILENCE_DURATION = 400;
  const MIN_SPEAKING_DURATION = 300;
  const MAX_RECORDING_TIME = 15000;

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    setIsSpeaking(false);
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopListening]);

  useEffect(() => {
    if (!disabled && !isProcessing && !isPlayingAudio && hasPermission === true && !isListening) {
      startListening();
    }
    if ((isProcessing || isPlayingAudio || disabled) && isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [disabled, isProcessing, isPlayingAudio, hasPermission, isListening]);

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

  const startListening = useCallback(async () => {
    let stream = streamRef.current;

    if (!stream) {
      stream = await requestPermission();
      if (!stream) return;
    }

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    let mimeType = "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      mimeType = "audio/webm;codecs=opus";
    }

    audioChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      if (audioBlob.size > 1000 && speakingStartTimeRef.current) {
        const speakingDuration = Date.now() - speakingStartTimeRef.current;
        if (speakingDuration >= MIN_SPEAKING_DURATION) {
          onRecordingComplete(audioBlob);
        }
      }
      speakingStartTimeRef.current = null;
      audioChunksRef.current = [];
    };

    mediaRecorder.start(100);
    setIsListening(true);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkAudioLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average);

      if (average > SILENCE_THRESHOLD) {
        if (!isSpeaking) {
          setIsSpeaking(true);
          speakingStartTimeRef.current = Date.now();
        }
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        
        // Force send after max recording time
        if (speakingStartTimeRef.current) {
          const elapsed = Date.now() - speakingStartTimeRef.current;
          if (elapsed >= MAX_RECORDING_TIME) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop();
            }
            setIsSpeaking(false);
            setIsListening(false);
            return;
          }
        }
      } else if (isSpeaking) {
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop();
            }
            setIsSpeaking(false);
            setIsListening(false);
          }, SILENCE_DURATION);
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }, [requestPermission, onRecordingComplete, isSpeaking]);

  useEffect(() => {
    if (hasPermission === null) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center gap-3 p-4" data-testid="voice-recorder-no-permission">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <MicOff className="w-7 h-7 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Se necesita acceso al micrófono
        </p>
        <Button variant="outline" onClick={requestPermission} data-testid="button-request-mic-permission">
          Permitir micrófono
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3" data-testid="continuous-voice-recorder">
      {isProcessing ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Procesando...</span>
        </div>
      ) : isPlayingAudio ? (
        <div className="flex items-center gap-2 text-primary">
          <VoiceWaveform isActive={true} variant="playing" size="md" />
          <span className="text-sm">Paciente hablando...</span>
        </div>
      ) : isListening ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isSpeaking ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}
            />
            <span className="text-sm text-muted-foreground">
              {isSpeaking ? "Escuchando..." : "Esperando que hables..."}
            </span>
          </div>
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${isSpeaking ? "bg-green-500" : "bg-yellow-500"}`}
              style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mic className="w-5 h-5" />
          <span className="text-sm">Iniciando micrófono...</span>
        </div>
      )}
    </div>
  );
}
