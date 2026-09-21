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
    const assistantMessage = completion.choices[0]?.message;
    if (!assistantMessage) throw new AppError("MALFORMED_AI_RESPONSE", "The assistant returned an empty response.", 502);

    await conversations.append(conversation._id, assistantMessage);
    let action: ChatResponse["action"];
    if (assistantMessage.tool_calls?.length) {
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function" || toolCall.function.name !== "createReminder") {
          throw new AppError("UNKNOWN_TOOL", "The assistant requested an unsupported action.", 422);
        }
        action = await executeCreateReminder(reminders, toolCall.function.arguments, `${conversation._id}:${toolCall.id}`);
        await conversations.append(conversation._id, {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(action),
        });
      }
      const finalConversation = await conversations.getOrCreate(conversation._id);
      const finalCompletion = await this.aiService.complete(finalConversation.messages);
      const finalMessage = finalCompletion.choices[0]?.message;
      if (!finalMessage?.content) throw new AppError("MALFORMED_AI_RESPONSE", "The assistant returned an empty response.", 502);
      await conversations.append(conversation._id, finalMessage);
      return { conversationId: conversation._id, message: { role: "assistant", content: finalMessage.content }, action };
    }

    return {
      conversationId: conversation._id,
      message: { role: "assistant", content: assistantMessage.content || "I need a little more information to help with that." },
    };
  }
}
