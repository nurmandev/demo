import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
export type StoredRole = "user" | "model" | "tool";

export interface StoredFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface StoredFunctionResponse {
  name: string;
  response: Record<string, unknown>;
}

export interface StoredMessage {
  role: StoredRole;
  content?: string;
  functionCalls?: StoredFunctionCall[];
  functionResponse?: StoredFunctionResponse;
  timestamp: Date;
}

interface ConversationDocument {
  _id: string;
  messages: StoredMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export class ConversationRepository {
  constructor(private readonly db: Db) {}

  async getOrCreate(id?: string) {
    const collection = this.db.collection<ConversationDocument>("conversations");
    if (id) {
      const existing = await collection.findOne({ _id: id });
      if (existing) return existing;
    }
    const now = new Date();
    const conversation: ConversationDocument = { _id: id || randomUUID(), messages: [], createdAt: now, updatedAt: now };
    await collection.insertOne(conversation);
    return conversation;
  }

  async append(id: string, message: Omit<StoredMessage, "timestamp">) {
    await this.db.collection<ConversationDocument>("conversations").updateOne(
      { _id: id },
      { $push: { messages: { ...message, timestamp: new Date() } }, $set: { updatedAt: new Date() } },
    );
  }
}
