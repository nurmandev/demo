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
    const conversation = await conversations.getOrCreate(conversationId);
    await conversations.append(conversation._id, { role: "user", content: message });
    const latest = await conversations.getOrCreate(conversation._id);
    const completion = await this.aiService.complete(latest.messages);

    if (!completion.text && (!completion.functionCalls || completion.functionCalls.length === 0)) {
      throw new AppError("MALFORMED_AI_RESPONSE", "The assistant returned an empty response.", 502);
    }

    let action: ChatResponse["action"];
    if (completion.functionCalls?.length) {
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
        action = await executeCreateReminder(reminders, toolCall.args, `${conversation._id}:${toolCall.name}:${i}`);
        await conversations.append(conversation._id, {
          role: "tool",
          functionResponse: {
            name: toolCall.name,
            response: {
              success: true,
              reminderId: action.id,
              title: action.title,
              scheduledAt: action.scheduledAt,
              status: action.status,
            },
          },
        });
      }

      const finalConversation = await conversations.getOrCreate(conversation._id);
      const finalCompletion = await this.aiService.complete(finalConversation.messages);
      const finalContent = finalCompletion.text;
      if (!finalContent) throw new AppError("MALFORMED_AI_RESPONSE", "The assistant returned an empty response.", 502);
      await conversations.append(conversation._id, { role: "model", content: finalContent });
      return { conversationId: conversation._id, message: { role: "assistant", content: finalContent }, action };
    }

    await conversations.append(conversation._id, { role: "model", content: completion.text });
    return {
      conversationId: conversation._id,
      message: { role: "assistant", content: completion.text || "I need a little more information to help with that." },
    };
  }
}
