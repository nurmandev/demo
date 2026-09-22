import { z } from "zod";
import { Type, type FunctionDeclaration } from "@google/genai";
import type { ReminderAction } from "@shared/api";
import { ReminderRepository } from "../repositories/reminder.repository";
import { AppError } from "../utils/errors";

export const createReminderArguments = z.object({
  title: z.string().trim().min(1).max(200),
  scheduledAt: z.string().datetime({ offset: true }),
});

export const createReminderDeclaration: FunctionDeclaration = {
  name: "createReminder",
  description: "Create a reminder when the user explicitly asks to be reminded about something.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "The concise reminder title.",
      },
      scheduledAt: {
        type: Type.STRING,
        description: "The scheduled date and time as a complete ISO-8601 datetime with explicit timezone offset (e.g. 2026-09-23T10:00:00Z or 2026-09-23T10:00:00.000Z).",
      },
    },
    required: ["title", "scheduledAt"],
  },
};

export async function executeCreateReminder(
  repository: ReminderRepository,
  rawArguments: unknown,
  idempotencyKey: string,
): Promise<ReminderAction> {
  let parsed = rawArguments;
  if (typeof rawArguments === "string") {
    try {
      parsed = JSON.parse(rawArguments);
    } catch {
      throw new AppError("INVALID_TOOL_ARGUMENTS", "The assistant returned invalid reminder details.", 422);
    }
  }
  const input = createReminderArguments.safeParse(parsed);
  if (!input.success || Number.isNaN(new Date(input.data.scheduledAt).getTime())) {
    throw new AppError("INVALID_TOOL_ARGUMENTS", "The assistant returned invalid reminder details.", 422);
  }
  return repository.create({ title: input.data.title, scheduledAt: new Date(input.data.scheduledAt), idempotencyKey });
}
