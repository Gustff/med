import type { Message, ChatSession, SavedConversation, UsageStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getSession(id: string): Promise<ChatSession | undefined>;
  createSession(id: string): Promise<ChatSession>;
  updateSession(session: ChatSession): Promise<ChatSession>;
  addMessageToSession(sessionId: string, message: Message): Promise<void>;
  saveConversation(conversation: SavedConversation): Promise<SavedConversation>;
  getConversations(): Promise<SavedConversation[]>;
  getConversation(id: string): Promise<SavedConversation | undefined>;
  deleteConversation(id: string): Promise<boolean>;
  getUsageStats(): Promise<UsageStats>;
  addUsageMinutes(minutes: number): Promise<UsageStats>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, ChatSession>;
  private savedConversations: Map<string, SavedConversation>;
  private usageStats: UsageStats;

  constructor() {
    this.sessions = new Map();
    this.savedConversations = new Map();
    // Initialize usage stats with 500 hours (30000 minutes) limit per 30 days
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    this.usageStats = {
      usedMinutes: 0,
      limitMinutes: 30000, // 500 hours
      periodStartDate: now,
      periodEndDate: now + thirtyDaysMs,
    };
  }

  async getSession(id: string): Promise<ChatSession | undefined> {
    return this.sessions.get(id);
  }

  async createSession(id: string): Promise<ChatSession> {
    const session: ChatSession = {
      id,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(session: ChatSession): Promise<ChatSession> {
    session.updatedAt = Date.now();
    this.sessions.set(session.id, session);
    return session;
  }

  async addMessageToSession(sessionId: string, message: Message): Promise<void> {
    let session = await this.getSession(sessionId);
    if (!session) {
      session = await this.createSession(sessionId);
    }
    session.messages.push(message);
    session.updatedAt = Date.now();
    this.sessions.set(sessionId, session);
  }

  async saveConversation(conversation: SavedConversation): Promise<SavedConversation> {
    this.savedConversations.set(conversation.id, conversation);
    return conversation;
  }

  async getConversations(): Promise<SavedConversation[]> {
    return Array.from(this.savedConversations.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async getConversation(id: string): Promise<SavedConversation | undefined> {
    return this.savedConversations.get(id);
  }

  async deleteConversation(id: string): Promise<boolean> {
    return this.savedConversations.delete(id);
  }

  async getUsageStats(): Promise<UsageStats> {
    // Check if period has expired and reset if needed
    const now = Date.now();
    if (now > this.usageStats.periodEndDate) {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      this.usageStats = {
        usedMinutes: 0,
        limitMinutes: 30000,
        periodStartDate: now,
        periodEndDate: now + thirtyDaysMs,
      };
    }
    return this.usageStats;
  }

  async addUsageMinutes(minutes: number): Promise<UsageStats> {
    await this.getUsageStats(); // This will reset if period expired
    this.usageStats.usedMinutes += minutes;
    return this.usageStats;
  }
}

export const storage = new MemStorage();
