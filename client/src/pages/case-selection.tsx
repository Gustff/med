import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Stethoscope, Heart, Baby, Activity, ArrowRight, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { CLINICAL_CASES, type ClinicalCase, type ClinicalDomain } from "@shared/schema";

const CATEGORY_INFO: Record<ClinicalDomain, { label: string; icon: typeof Stethoscope; color: string; bgColor: string }> = {
  trauma_shock: { 
    label: "Trauma / Shock", 
    icon: AlertTriangle, 
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30"
  },
  gynecology: { 
    label: "Ginecología / Embarazo", 
    icon: Baby, 
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/30"
  },
  clinical: { 
    label: "Hospitalización / Clínico", 
    icon: Activity, 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30"
  },
};

export default function CaseSelection() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<ClinicalDomain | null>(null);

  const traumaCases = CLINICAL_CASES.filter(c => c.category === "trauma_shock");
  const gynCases = CLINICAL_CASES.filter(c => c.category === "gynecology");
  const clinicalCases = CLINICAL_CASES.filter(c => c.category === "clinical");

  const handleSelectCase = (caseItem: ClinicalCase) => {
    setLocation(`/simulation/${caseItem.id}`);
  };

  const renderCategoryCard = (category: ClinicalDomain, cases: ClinicalCase[]) => {
    const info = CATEGORY_INFO[category];
    const Icon = info.icon;
    const isSelected = selectedCategory === category;

    return (
      <Card 
        key={category}
        className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover-elevate'}`}
        onClick={() => setSelectedCategory(isSelected ? null : category)}
        data-testid={`card-category-${category}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className={`p-2 rounded-md ${info.bgColor}`}>
              <Icon className={`w-5 h-5 ${info.color}`} />
            </div>
            <Badge variant="secondary">{cases.length} casos</Badge>
          </div>
          <CardTitle className="text-lg mt-2">{info.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {category === "trauma_shock" && "Emergencias traumáticas, shock y lesiones graves"}
            {category === "gynecology" && "Casos obstétricos y ginecológicos de emergencia"}
            {category === "clinical" && "Patologías médicas que requieren hospitalización"}
          </p>
        </CardContent>
      </Card>
    );
  };

  const getCasesForCategory = (category: ClinicalDomain) => {
    switch (category) {
      case "trauma_shock": return traumaCases;
      case "gynecology": return gynCases;
      case "clinical": return clinicalCases;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-3 right-3 z-10">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Stethoscope className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Simulador de Pacientes</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Selecciona una categoría y un caso clínico para comenzar tu entrenamiento de triaje
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {renderCategoryCard("trauma_shock", traumaCases)}
          {renderCategoryCard("gynecology", gynCases)}
          {renderCategoryCard("clinical", clinicalCases)}
        </div>

        {selectedCategory && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = CATEGORY_INFO[selectedCategory].icon;
                  return <Icon className={`w-5 h-5 ${CATEGORY_INFO[selectedCategory].color}`} />;
                })()}
                {CATEGORY_INFO[selectedCategory].label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {getCasesForCategory(selectedCategory).map((caseItem, index) => (
                    <div
                      key={caseItem.id}
                      className="flex items-center justify-between p-3 rounded-md border hover-elevate cursor-pointer group"
                      onClick={() => handleSelectCase(caseItem)}
                      data-testid={`case-item-${caseItem.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          {index + 1}.
                        </span>
                        <div>
                          <p className="font-medium">{caseItem.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {caseItem.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 p-4 rounded-lg bg-muted/50">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Sistema de Triaje
          </h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-600">PS1</Badge>
              <span className="text-muted-foreground">Emergencia - Riesgo vital</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500">PS2</Badge>
              <span className="text-muted-foreground">Urgente - Evaluación en horas</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">PS3</Badge>
              <span className="text-muted-foreground">No urgente - Seguimiento</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
