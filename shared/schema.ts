import { z } from "zod";

// Triage priority levels
export type TriagePriority = "PS1" | "PS2" | "PS3";

// Clinical domains
export type ClinicalDomain = "trauma_shock" | "gynecology" | "clinical";

// Message role types
export type MessageRole = "user" | "assistant" | "system";

// Clinical case definition
export interface ClinicalCase {
  id: string;
  name: string;
  category: ClinicalDomain;
  description: string;
}

// All 50 clinical cases organized by category
export const CLINICAL_CASES: ClinicalCase[] = [
  // TRAUMA/SHOCK (18 cases)
  { id: "trauma_1", name: "Hemotórax masivo postraumático", category: "trauma_shock", description: "Hemotórax masivo postraumático con shock hipovolémico" },
  { id: "trauma_2", name: "Neumotórax a tensión", category: "trauma_shock", description: "Neumotórax a tensión postraumático con taponamiento cardíaco incipiente" },
  { id: "trauma_3", name: "Contusión pulmonar bilateral", category: "trauma_shock", description: "Traumatismo torácico cerrado con contusión pulmonar bilateral y síndrome de dificultad respiratoria" },
  { id: "trauma_4", name: "Laceración cardíaca", category: "trauma_shock", description: "Laceración cardíaca con taponamiento cardíaco" },
  { id: "trauma_5", name: "Fractura de esternón", category: "trauma_shock", description: "Fractura de esternón con contusión miocárdica" },
  { id: "trauma_6", name: "Rotura de diafragma", category: "trauma_shock", description: "Rotura de diafragma con herniación de vísceras abdominales" },
  { id: "trauma_7", name: "Shock hipovolémico masivo", category: "trauma_shock", description: "Shock hipovolémico masivo por hemorragia retroperitoneal" },
  { id: "trauma_8", name: "Síndrome compartimental torácico", category: "trauma_shock", description: "Síndrome compartimental torácico postraumático" },
  { id: "trauma_9", name: "Ruptura traqueal", category: "trauma_shock", description: "Lesión de vía aérea principal (ruptura traqueal)" },
  { id: "trauma_10", name: "Taponamiento cardíaco", category: "trauma_shock", description: "Taponamiento cardíaco por neumotórax a tensión" },
  { id: "trauma_11", name: "SDRA post-trauma", category: "trauma_shock", description: "Síndrome de dificultad respiratoria aguda post-trauma" },
  { id: "trauma_12", name: "Lesión aorta torácica", category: "trauma_shock", description: "Politraumatismo con lesión aorta torácica" },
  { id: "trauma_13", name: "Hemotórax con CID", category: "trauma_shock", description: "Hemotórax con coagulación intravascular diseminada" },
  { id: "trauma_14", name: "Contusión miocárdica severa", category: "trauma_shock", description: "Shock cardiogénico por contusión miocárdica severa" },
  { id: "trauma_15", name: "Síndrome de aplastamiento", category: "trauma_shock", description: "Síndrome de aplastamiento con rabdomiolisis post-trauma" },
  { id: "trauma_16", name: "Laceración mesentérica", category: "trauma_shock", description: "Traumatismo abdominal cerrado con laceración mesentérica" },
  { id: "trauma_17", name: "Lesión arterial femoral", category: "trauma_shock", description: "Lesión vascular arterial femoral con shock hemorrágico" },
  { id: "trauma_18", name: "Quemaduras por explosión", category: "trauma_shock", description: "Quemaduras por explosión con inhalación de humo" },
  
  // GYNECOLOGY/PREGNANCY (18 cases)
  { id: "gyn_1", name: "Embarazo ectópico roto", category: "gynecology", description: "Embarazo ectópico roto con shock hemorrágico" },
  { id: "gyn_2", name: "Preeclampsia severa", category: "gynecology", description: "Preeclampsia severa con síndrome HELLP" },
  { id: "gyn_3", name: "Desprendimiento de placenta", category: "gynecology", description: "Desprendimiento prematuro de placenta" },
  { id: "gyn_4", name: "Pielonefritis en gestante", category: "gynecology", description: "Pielonefritis aguda en gestante con fallo renal" },
  { id: "gyn_5", name: "Parto prematuro con RPM", category: "gynecology", description: "Amenaza de parto prematuro con rotura prematura de membranas" },
  { id: "gyn_6", name: "HELLP con complicaciones", category: "gynecology", description: "Síndrome de HELLP con complicaciones hepáticas" },
  { id: "gyn_7", name: "Corioamnionitis", category: "gynecology", description: "Corioamnionitis en gestante con trabajo de parto pretérmino" },
  { id: "gyn_8", name: "Apendicitis en gestante", category: "gynecology", description: "Apendicitis aguda en gestante" },
  { id: "gyn_9", name: "Placenta previa sangrante", category: "gynecology", description: "Placenta previa con hemorragia masiva" },
  { id: "gyn_10", name: "Inversión uterina", category: "gynecology", description: "Inversión uterina posparto" },
  { id: "gyn_11", name: "HELLP con hemorragia", category: "gynecology", description: "Síndrome de HELLP con hemorragia subaracnoidea" },
  { id: "gyn_12", name: "Miocardiopatía peripartum", category: "gynecology", description: "Miocardiopatía peripartum" },
  { id: "gyn_13", name: "Colecistitis en gestante", category: "gynecology", description: "Colecistitis aguda en gestante" },
  { id: "gyn_14", name: "Embolia de líquido amniótico", category: "gynecology", description: "Embolia de líquido amniótico" },
  { id: "gyn_15", name: "Acreta placentaria", category: "gynecology", description: "Acreta placentaria con histerectomía de emergencia" },
  { id: "gyn_16", name: "Trombosis venosa post-parto", category: "gynecology", description: "Trombosis venosa profunda post-parto" },
  { id: "gyn_17", name: "Síndrome de Sheehan", category: "gynecology", description: "Síndrome de Sheehan (necrosis hipofisaria posparto)" },
  { id: "gyn_18", name: "Ruptura uterina", category: "gynecology", description: "Ruptura uterina durante trabajo de parto" },
  
  // CLINICAL/HOSPITALIZATION (22 cases)
  { id: "clin_1", name: "Neumonía grave con sepsis", category: "clinical", description: "Neumonía grave adquirida en comunidad con sepsis" },
  { id: "clin_2", name: "STEMI inferior", category: "clinical", description: "Síndrome coronario agudo tipo STEMI inferior" },
  { id: "clin_3", name: "Insuficiencia renal aguda", category: "clinical", description: "Insuficiencia renal aguda por necrosis tubular aguda" },
  { id: "clin_4", name: "SDRA tipo H", category: "clinical", description: "Síndrome de dificultad respiratoria aguda (SDRA) tipo H" },
  { id: "clin_5", name: "Hepatitis fulminante", category: "clinical", description: "Hepatitis fulminante" },
  { id: "clin_6", name: "TEP masivo", category: "clinical", description: "Tromboembolismo pulmonar masivo" },
  { id: "clin_7", name: "Cetoacidosis diabética", category: "clinical", description: "Cetoacidosis diabética severa" },
  { id: "clin_8", name: "Endocarditis bacteriana", category: "clinical", description: "Endocarditis bacteriana subaguda" },
  { id: "clin_9", name: "Meningitis con sepsis", category: "clinical", description: "Meningitis bacteriana con sepsis" },
  { id: "clin_10", name: "Pancreatitis aguda severa", category: "clinical", description: "Pancreatitis aguda severa con síndrome de dificultad respiratoria" },
  { id: "clin_11", name: "Síndrome hepatopulmonar", category: "clinical", description: "Síndrome hepatopulmonar" },
  { id: "clin_12", name: "Púrpura trombótica (TTP)", category: "clinical", description: "Síndrome de trombótica trombocitopénica purpura (TTP)" },
  { id: "clin_13", name: "Sepsis por catéter", category: "clinical", description: "Sepsis por catéter central con embolización séptica" },
  { id: "clin_14", name: "Encefalopatía hepática IV", category: "clinical", description: "Encefalopatía hepática aguda grado IV" },
  { id: "clin_15", name: "Nefritis lúpica grado IV", category: "clinical", description: "Nefritis lúpica grado IV con insuficiencia renal rápidamente progresiva" },
  { id: "clin_16", name: "PTI crónica severa", category: "clinical", description: "Púrpura trombocitopénica inmunológica (PTI) crónica severa" },
  { id: "clin_17", name: "Guillain-Barré", category: "clinical", description: "Síndrome de Guillain-Barré con parálisis respiratoria" },
  { id: "clin_18", name: "Crisis tiroidea", category: "clinical", description: "Crisis tiroidea (Tirotoxicosis)" },
  { id: "clin_19", name: "Intoxicación por CO", category: "clinical", description: "Intoxicación por monóxido de carbono severa" },
  { id: "clin_20", name: "Shock anafiláctico", category: "clinical", description: "Shock distributivo por anafilaxia" },
  { id: "clin_21", name: "Compresión vena cava", category: "clinical", description: "Síndrome de compresión de la vena cava superior" },
  { id: "clin_22", name: "Compresión medular", category: "clinical", description: "Síndrome de compresión medular por metástasis ósea" },
];

// Message schema for chat
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.number(),
  audioUrl: z.string().optional(),
  triagePriority: z.enum(["PS1", "PS2", "PS3"]).optional(),
  clinicalDomain: z.enum(["trauma_shock", "gynecology", "clinical"]).optional(),
});

export type Message = z.infer<typeof messageSchema>;

// Chat session schema
export const chatSessionSchema = z.object({
  id: z.string(),
  messages: z.array(messageSchema),
  currentTriagePriority: z.enum(["PS1", "PS2", "PS3"]).optional(),
  currentClinicalDomain: z.enum(["trauma_shock", "gynecology", "clinical"]).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type ChatSession = z.infer<typeof chatSessionSchema>;

// Saved conversation schema
export const savedConversationSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  caseName: z.string(),
  category: z.enum(["trauma_shock", "gynecology", "clinical"]),
  messages: z.array(messageSchema),
  finalTriage: z.enum(["PS1", "PS2", "PS3"]).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type SavedConversation = z.infer<typeof savedConversationSchema>;

// Transcription request/response
export const transcriptionRequestSchema = z.object({
  audioData: z.string(), // Base64 encoded audio
  language: z.string().default("es"),
});

export type TranscriptionRequest = z.infer<typeof transcriptionRequestSchema>;

export const transcriptionResponseSchema = z.object({
  text: z.string(),
  language: z.string(),
});

export type TranscriptionResponse = z.infer<typeof transcriptionResponseSchema>;

// Chat request/response
export const chatRequestSchema = z.object({
  message: z.string(),
  sessionId: z.string().optional(),
  history: z.array(messageSchema).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatResponseSchema = z.object({
  message: z.string(),
  triagePriority: z.enum(["PS1", "PS2", "PS3"]).optional(),
  clinicalDomain: z.enum(["trauma_shock", "gynecology", "clinical"]).optional(),
  sessionId: z.string(),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;

// Speech synthesis request/response
export const synthesisRequestSchema = z.object({
  text: z.string(),
  voice: z.string().default("alloy"),
});

export type SynthesisRequest = z.infer<typeof synthesisRequestSchema>;

// Usage tracking schema
export const usageStatsSchema = z.object({
  usedMinutes: z.number(),
  limitMinutes: z.number(), // 500 hours = 30000 minutes
  periodStartDate: z.number(),
  periodEndDate: z.number(),
});

export type UsageStats = z.infer<typeof usageStatsSchema>;

// User schema (keeping existing for compatibility)
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = InsertUser & { id: string };
