import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle, Baby, Activity, Save, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CLINICAL_CASES, type ClinicalDomain, type Message } from "@shared/schema";

const CATEGORY_INFO: Record<ClinicalDomain, { label: string; icon: typeof AlertTriangle; color: string }> = {
  trauma_shock: { label: "Trauma/Shock", icon: AlertTriangle, color: "bg-red-600" },
  gynecology: { label: "Ginecología", icon: Baby, color: "bg-pink-600" },
  clinical: { label: "Clínico", icon: Activity, color: "bg-blue-600" },
};

export default function Simulation() {
  const params = useParams<{ caseId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  
  const selectedCase = CLINICAL_CASES.find(c => c.id === params.caseId);
  
  if (!selectedCase) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Caso no encontrado</h2>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const handleSaveConversation = async () => {
    if (currentMessages.length < 2) {
      toast({
        title: "Conversación muy corta",
        description: "Necesitas al menos una interacción para guardar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCase.id,
          caseName: selectedCase.name,
          category: selectedCase.category,
          messages: currentMessages,
        }),
      });

      if (response.ok) {
        toast({
          title: "Conversación guardada",
          description: "Puedes ver tus conversaciones guardadas desde el inicio.",
        });
      } else {
        throw new Error("Error al guardar");
      }
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la conversación.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndConversation = async (shouldSave: boolean) => {
    setShowEndDialog(false);
    setIsSessionEnded(true);
    
    if (shouldSave && currentMessages.length >= 2) {
      await handleSaveConversation();
    }
    
    toast({
      title: "Consulta finalizada",
      description: shouldSave ? "Tu conversación ha sido guardada." : "Has terminado la consulta.",
    });
  };

  const categoryInfo = CATEGORY_INFO[selectedCase.category];
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex-shrink-0 border-b border-border bg-card px-4 py-2">
        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Badge className={categoryInfo.color}>
                <CategoryIcon className="w-3 h-3 mr-1" />
                {categoryInfo.label}
              </Badge>
              <span className="text-sm font-medium hidden sm:inline">
                {selectedCase.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSessionEnded ? (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setLocation("/")}
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver al inicio
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSaveConversation}
                  disabled={isSaving || currentMessages.length < 2}
                  data-testid="button-save"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? "Guardando..." : "Guardar"}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowEndDialog(true)}
                  data-testid="button-end"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Terminar
                </Button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <ChatInterface 
          selectedCase={selectedCase}
          onMessagesChange={setCurrentMessages}
          isSessionEnded={isSessionEnded}
        />
      </main>

      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminar consulta</AlertDialogTitle>
            <AlertDialogDescription>
              {currentMessages.length >= 2 
                ? "¿Deseas guardar esta conversación antes de terminar?"
                : "¿Estás seguro que deseas terminar la consulta?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-end">Cancelar</AlertDialogCancel>
            {currentMessages.length >= 2 ? (
              <>
                <AlertDialogAction 
                  onClick={() => handleEndConversation(false)}
                  className="bg-muted text-foreground hover:bg-muted/80"
                  data-testid="button-end-no-save"
                >
                  Terminar sin guardar
                </AlertDialogAction>
                <AlertDialogAction 
                  onClick={() => handleEndConversation(true)}
                  data-testid="button-end-save"
                >
                  Guardar y terminar
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction 
                onClick={() => handleEndConversation(false)}
                data-testid="button-confirm-end"
              >
                Terminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
