import { randomUUID } from "node:crypto";
import type { Db, ObjectId } from "mongodb";
import type { ReminderAction } from "@shared/api";

interface ReminderDocument {
  _id: string;
  userId?: string;
  title: string;
  scheduledAt: Date;
  createdAt: Date;
  updatedAt: Date;
  status: "active";
  idempotencyKey: string;
}

export class ReminderRepository {
  constructor(private readonly db: Db) {}

  async create(input: { title: string; scheduledAt: Date; idempotencyKey: string; userId?: string }): Promise<ReminderAction> {
    const collection = this.db.collection<ReminderDocument>("reminders");
    const existing = await collection.findOne({ idempotencyKey: input.idempotencyKey });
    if (existing) return this.toAction(existing);
    const now = new Date();
    const document: ReminderDocument = {
      _id: randomUUID(),
      userId: input.userId,
      title: input.title,
      scheduledAt: input.scheduledAt,
      createdAt: now,
      updatedAt: now,
      status: "active",
      idempotencyKey: input.idempotencyKey,
    };
    await collection.insertOne(document);
    return this.toAction(document);
  }

  private toAction(document: ReminderDocument): ReminderAction {
    return {
      type: "reminder_created",
      id: document._id,
      title: document.title,
      scheduledAt: document.scheduledAt.toISOString(),
      status: document.status,
    };
  }
}
