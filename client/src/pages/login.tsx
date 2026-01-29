import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Stethoscope, KeyRound, AlertCircle } from "lucide-react";

const ACCESS_KEY = "KAبZЯΩRمФQλSنTЖUحVГY";

export default function Login() {
  const [, setLocation] = useLocation();
  const [key, setKey] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    setTimeout(() => {
      if (key === ACCESS_KEY) {
        localStorage.setItem("usilmedai_authenticated", "true");
        setLocation("/cases");
      } else {
        setError(true);
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-3 right-3 z-10">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Stethoscope className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-wide">USILMEDAI</CardTitle>
          <p className="text-muted-foreground mt-2">
            Simulador de Pacientes para Entrenamiento Médico
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Clave de acceso
              </label>
              <Input
                type="password"
                placeholder="Ingresa tu clave de acceso"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError(false);
                }}
                className={error ? "border-destructive" : ""}
                data-testid="input-access-key"
              />
              {error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Clave incorrecta. Intenta de nuevo.
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !key}
              data-testid="button-login"
            >
              {isLoading ? "Verificando..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
