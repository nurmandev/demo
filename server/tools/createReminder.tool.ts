import { z } from "zod";
import type OpenAI from "openai";
import type { ReminderAction } from "@shared/api";
import { ReminderRepository } from "../repositories/reminder.repository";
import { AppError } from "../utils/errors";

export const createReminderArguments = z.object({
  title: z.string().trim().min(1).max(200),
  scheduledAt: z.string().datetime({ offset: true }),
});

export const createReminderDefinition: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "createReminder",
    description: "Create a reminder when the user explicitly asks to be reminded about something.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string", description: "The concise reminder title." },
        scheduledAt: { type: "string", description: "The scheduled date and time as an ISO-8601 datetime with timezone offset." },
      },
      required: ["title", "scheduledAt"],
    },
  },
};

export async function executeCreateReminder(
  repository: ReminderRepository,
  argumentsJson: string,
  idempotencyKey: string,
): Promise<ReminderAction> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(argumentsJson);
  } catch {
    throw new AppError("INVALID_TOOL_ARGUMENTS", "The assistant returned invalid reminder details.", 422);
  }
  const input = createReminderArguments.safeParse(parsed);
  if (!input.success || Number.isNaN(new Date(input.data.scheduledAt).getTime())) {
    throw new AppError("INVALID_TOOL_ARGUMENTS", "The assistant returned invalid reminder details.", 422);
  }
  return repository.create({ title: input.data.title, scheduledAt: new Date(input.data.scheduledAt), idempotencyKey });
}
