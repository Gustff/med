import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import type { TriagePriority, ClinicalDomain } from "@shared/schema";

interface TriageIndicatorProps {
  priority?: TriagePriority;
  domain?: ClinicalDomain;
  showLabel?: boolean;
}

const priorityConfig = {
  PS1: {
    label: "Emergencia",
    description: "Riesgo vital - Hospital inmediato",
    icon: AlertTriangle,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
    dotClass: "bg-red-500",
  },
  PS2: {
    label: "Urgente",
    description: "Evaluación médica en horas",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  PS3: {
    label: "No urgente",
    description: "Orientación y seguimiento",
    icon: CheckCircle,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
};

const domainConfig = {
  trauma_shock: {
    label: "Trauma/Shock",
    className: "bg-red-500/5 text-red-600 dark:text-red-400",
  },
  gynecology: {
    label: "Ginecología",
    className: "bg-purple-500/5 text-purple-600 dark:text-purple-400",
  },
  clinical: {
    label: "Clínico",
    className: "bg-blue-500/5 text-blue-600 dark:text-blue-400",
  },
};

export function TriageIndicator({ priority, domain, showLabel = true }: TriageIndicatorProps) {
  if (!priority) return null;

  const config = priorityConfig[priority];
  const Icon = config.icon;
  const domainInfo = domain ? domainConfig[domain] : null;

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="triage-indicator">
      <Badge 
        variant="outline" 
        className={`${config.className} border gap-1.5`}
        data-testid={`badge-priority-${priority.toLowerCase()}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotClass} animate-pulse`} />
        <Icon className="w-3.5 h-3.5" />
        {showLabel && <span className="font-medium">{config.label}</span>}
      </Badge>
      
      {domainInfo && (
        <Badge 
          variant="outline" 
          className={`${domainInfo.className} border-transparent`}
          data-testid={`badge-domain-${domain}`}
        >
          {domainInfo.label}
        </Badge>
      )}
    </div>
  );
}

export function TriageLegend() {
  return (
    <div 
      className="p-4 bg-card rounded-lg border border-card-border space-y-3"
      data-testid="triage-legend"
    >
      <h4 className="text-sm font-semibold text-foreground">Niveles de Prioridad</h4>
      <div className="space-y-2">
        {Object.entries(priorityConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className="flex items-start gap-3">
              <div className={`p-1.5 rounded-md ${config.className}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
