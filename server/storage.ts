import type { Message, ChatSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getSession(id: string): Promise<ChatSession | undefined>;
  createSession(id: string): Promise<ChatSession>;
  updateSession(session: ChatSession): Promise<ChatSession>;
  addMessageToSession(sessionId: string, message: Message): Promise<void>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, ChatSession>;

  constructor() {
    this.sessions = new Map();
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
}

export const storage = new MemStorage();
