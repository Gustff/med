import { User, Stethoscope, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TriageIndicator } from "./TriageIndicator";
import type { Message } from "@shared/schema";

interface MessageBubbleProps {
  message: Message;
  onPlayAudio?: (audioUrl: string) => void;
  isPlaying?: boolean;
}

export function MessageBubble({ message, onPlayAudio, isPlaying }: MessageBubbleProps) {
  const isUser = message.role === "user";
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      data-testid={`message-${message.id}`}
    >
      <div 
        className={`
          flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
          ${isUser 
            ? "bg-primary/10 text-primary" 
            : "bg-accent text-accent-foreground"
          }
        `}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Stethoscope className="w-4 h-4" />
        )}
      </div>
      
      <div className={`flex flex-col gap-1.5 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`
            px-4 py-3 rounded-2xl
            ${isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-card-border rounded-bl-md"
            }
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        
        <div className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
          
          {message.audioUrl && onPlayAudio && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => onPlayAudio(message.audioUrl!)}
              data-testid={`button-play-audio-${message.id}`}
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? "text-primary animate-pulse" : ""}`} />
            </Button>
          )}
        </div>
        
        {!isUser && (message.triagePriority || message.clinicalDomain) && (
          <div className="mt-1">
            <TriageIndicator 
              priority={message.triagePriority} 
              domain={message.clinicalDomain}
              showLabel={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
