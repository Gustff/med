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
  const recordingStartTimeRef = useRef<number | null>(null);
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  const isRecordingRef = useRef(false);

  const SILENCE_THRESHOLD = 15;
  const SILENCE_DURATION = 600;
  const MIN_RECORDING_DURATION = 300;
  const MAX_RECORDING_TIME = 15000;

  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const finishRecording = useCallback(() => {
    cleanup();
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      const startTime = recordingStartTimeRef.current;
      const recorder = mediaRecorderRef.current;
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        console.log("Recording finished, size:", audioBlob.size, "startTime:", startTime);
        
        if (audioBlob.size > 500 && startTime) {
          const duration = Date.now() - startTime;
          console.log("Duration:", duration, "ms");
          if (duration >= MIN_RECORDING_DURATION) {
            console.log("Sending for transcription");
            onRecordingCompleteRef.current(audioBlob);
          }
        }
        
        audioChunksRef.current = [];
        recordingStartTimeRef.current = null;
        isRecordingRef.current = false;
      };
      
      recorder.stop();
    }
    
    setIsSpeaking(false);
    setIsListening(false);
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [cleanup]);

  const startListening = useCallback(async () => {
    if (isRecordingRef.current) return;
    
    let stream = streamRef.current;

    if (!stream || stream.getTracks().some(t => t.readyState === "ended")) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setHasPermission(true);
      } catch (error) {
        console.error("Microphone error:", error);
        setHasPermission(false);
        return;
      }
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

    mediaRecorder.start(100);
    setIsListening(true);
    isRecordingRef.current = true;
    recordingStartTimeRef.current = null;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let consecutiveSilenceFrames = 0;
    const SILENCE_FRAMES_NEEDED = Math.ceil((SILENCE_DURATION / 1000) * 60);

    const checkAudioLevel = () => {
      if (!analyserRef.current || !isRecordingRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average);

      const isSpeakingNow = average > SILENCE_THRESHOLD;

      if (isSpeakingNow) {
        consecutiveSilenceFrames = 0;
        
        if (!recordingStartTimeRef.current) {
          console.log("Speech started, level:", average.toFixed(1));
          recordingStartTimeRef.current = Date.now();
          setIsSpeaking(true);
        }
        
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        
        // Check max recording time
        if (recordingStartTimeRef.current) {
          const elapsed = Date.now() - recordingStartTimeRef.current;
          if (elapsed >= MAX_RECORDING_TIME) {
            console.log("Max time reached, finishing");
            finishRecording();
            return;
          }
        }
      } else if (recordingStartTimeRef.current) {
        consecutiveSilenceFrames++;
        
        if (consecutiveSilenceFrames >= SILENCE_FRAMES_NEEDED) {
          console.log("Silence confirmed, finishing recording");
          finishRecording();
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }, [finishRecording]);

  // Auto-start when conditions are right
  useEffect(() => {
    const shouldListen = !disabled && !isProcessing && !isPlayingAudio && hasPermission === true;
    
    if (shouldListen && !isListening && !isRecordingRef.current) {
      const timer = setTimeout(() => {
        console.log("Auto-starting microphone");
        startListening();
      }, 300);
      return () => clearTimeout(timer);
    }
    
    if (!shouldListen && isRecordingRef.current) {
      console.log("Stopping due to conditions change");
      cleanup();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      setIsSpeaking(false);
      isRecordingRef.current = false;
    }
  }, [disabled, isProcessing, isPlayingAudio, hasPermission, isListening, startListening, cleanup]);

  // Request permission on mount
  useEffect(() => {
    if (hasPermission === null) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          streamRef.current = stream;
          setHasPermission(true);
        })
        .catch(() => setHasPermission(false));
    }
  }, [hasPermission]);

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center gap-3 p-4" data-testid="voice-recorder-no-permission">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <MicOff className="w-7 h-7 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Se necesita acceso al micrófono
        </p>
        <Button variant="outline" onClick={() => {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              streamRef.current = stream;
              setHasPermission(true);
            })
            .catch(() => setHasPermission(false));
        }} data-testid="button-request-mic-permission">
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
