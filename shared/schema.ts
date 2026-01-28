import { z } from "zod";

// Triage priority levels
export type TriagePriority = "PS1" | "PS2" | "PS3";

// Clinical domains
export type ClinicalDomain = "trauma_shock" | "gynecology" | "clinical";

// Message role types
export type MessageRole = "user" | "assistant" | "system";

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

// User schema (keeping existing for compatibility)
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = InsertUser & { id: string };
