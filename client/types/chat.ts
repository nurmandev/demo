import type { ChatResponse as ApiChatResponse, ReminderAction } from "@shared/api";

export type MessageRole = "user" | "assistant" | "tool";
export type MessageStatus = "pending" | "success" | "error";
export type { ReminderAction };

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status?: MessageStatus;
  action?: ReminderAction;
}

export interface ChatResponse {
  conversationId: ApiChatResponse["conversationId"];
  message: string;
  action?: ReminderAction;
}
