import { describe, expect, it } from "vitest";
import { executeCreateReminder } from "./createReminder.tool";
import { ReminderRepository } from "../repositories/reminder.repository";

function createFakeDatabase() {
  const documents: Record<string, unknown>[] = [];
  const collection = {
    findOne: async ({ idempotencyKey }: { idempotencyKey: string }) => documents.find((document) => document.idempotencyKey === idempotencyKey) || null,
    insertOne: async (document: Record<string, unknown>) => { documents.push(document); },
  };
  return { collection: () => collection } as never;
}

describe("createReminder tool", () => {
  it("rejects invalid model arguments", async () => {
    await expect(executeCreateReminder(new ReminderRepository(createFakeDatabase()), JSON.stringify({ title: "Call John", scheduledAt: "tomorrow" }), "call-1")).rejects.toMatchObject({ code: "INVALID_TOOL_ARGUMENTS" });
  });

  it("persists a reminder and returns the stored action", async () => {
    const repository = new ReminderRepository(createFakeDatabase());
    const args = JSON.stringify({ title: "Call John", scheduledAt: "2026-09-22T10:00:00-04:00" });
    const first = await executeCreateReminder(repository, args, "call-1");
    const second = await executeCreateReminder(repository, args, "call-1");
    expect(first.type).toBe("reminder_created");
    expect(first.title).toBe("Call John");
    expect(first.id).toBe(second.id);
  });
});
