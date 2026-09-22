import type { Part } from "@google/genai";
import type { ChatResponse } from "@shared/api";
import { getDatabase } from "../config/database";
import { ConversationRepository } from "../repositories/conversation.repository";
import { ReminderRepository } from "../repositories/reminder.repository";
import { executeCreateReminder } from "../tools/createReminder.tool";
import { AiService } from "./ai.service";
import { AppError } from "../utils/errors";

export class ChatService {
  constructor(private readonly aiService: AiService) {}

  async send(message: string, conversationId?: string): Promise<ChatResponse> {
    const conversations = new ConversationRepository(getDatabase());
    const reminders = new ReminderRepository(getDatabase());

    // Load or create the conversation and get existing messages for history
    const conversation = await conversations.getOrCreate(conversationId);
    const history = conversation.messages; // all previous turns

    // Persist the user message
    await conversations.append(conversation._id, { role: "user", content: message });

    // Create a single chat session seeded with prior conversation history,
    // then send the user's message. Keeping the same session alive for the
    // full tool loop lets Gemini manage thoughtSignature internally —
    // no need to pass role:"tool" in a generateContent call.
    const session = this.aiService.createSession(history);

    const completion = await session.send(message);

    if (!completion.text && (!completion.functionCalls || completion.functionCalls.length === 0)) {
      throw new AppError("MALFORMED_AI_RESPONSE", "The assistant returned an empty response.", 502);
    }

    let action: ChatResponse["action"];

    if (completion.functionCalls?.length) {
      // Persist the model's function-call turn
      await conversations.append(conversation._id, {
        role: "model",
        content: completion.text,
        functionCalls: completion.functionCalls,
      });

      for (let i = 0; i < completion.functionCalls.length; i++) {
        const toolCall = completion.functionCalls[i];
        if (toolCall.name !== "createReminder") {
          throw new AppError("UNKNOWN_TOOL", "The assistant requested an unsupported action.", 422);
        }

        action = await executeCreateReminder(
          reminders,
          toolCall.args,
          `${conversation._id}:${toolCall.name}:${i}`,
        );

        const toolResponse = {
          success: true,
          reminderId: action.id,
          title: action.title,
          scheduledAt: action.scheduledAt,
          status: action.status,
        };

        // Persist the tool result to MongoDB
        await conversations.append(conversation._id, {
          role: "tool",
          functionResponse: { name: toolCall.name, response: toolResponse },
        });

        // Send the functionResponse back within the SAME session.
        // The session tracks thoughtSignature internally so Gemini accepts it.
        const toolResultParts: Part[] = [
          { functionResponse: { name: toolCall.name, response: toolResponse } },
        ];
        const finalCompletion = await session.send(toolResultParts);
        const finalContent = finalCompletion.text;

        if (!finalContent) {
          throw new AppError("MALFORMED_AI_RESPONSE", "The assistant returned an empty final response.", 502);
        }

        await conversations.append(conversation._id, { role: "model", content: finalContent });
        return {
          conversationId: conversation._id,
          message: { role: "assistant", content: finalContent },
          action,
        };
      }
    }

    // Plain text response (no tool call)
    await conversations.append(conversation._id, { role: "model", content: completion.text });
    return {
      conversationId: conversation._id,
      message: {
        role: "assistant",
        content: completion.text || "I need a little more information to help with that.",
      },
    };
  }
}
