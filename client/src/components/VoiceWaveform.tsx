interface VoiceWaveformProps {
  isActive: boolean;
  variant?: "recording" | "playing" | "processing";
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: { height: "h-4", barWidth: "w-0.5", gap: "gap-0.5" },
  md: { height: "h-8", barWidth: "w-1", gap: "gap-1" },
  lg: { height: "h-12", barWidth: "w-1.5", gap: "gap-1.5" },
};

const variantColors = {
  recording: "bg-red-500",
  playing: "bg-primary",
  processing: "bg-amber-500",
};

export function VoiceWaveform({ 
  isActive, 
  variant = "recording",
  size = "md" 
}: VoiceWaveformProps) {
  const { height, barWidth, gap } = sizeConfig[size];
  const barColor = variantColors[variant];
  
  const bars = 5;
  
  return (
    <div 
      className={`flex items-center justify-center ${gap} ${height}`}
      data-testid="voice-waveform"
      aria-label={isActive ? `${variant} activo` : "inactivo"}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`
            ${barWidth} rounded-full transition-all duration-150
            ${isActive ? `${barColor} animate-voice-wave voice-bar-${i + 1}` : "bg-muted-foreground/30"}
          `}
          style={{
            height: isActive ? "100%" : "30%",
          }}
        />
      ))}
    </div>
  );
}
