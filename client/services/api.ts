import type { ApiErrorResponse, ChatResponse as ApiChatResponse, TranscriptionResponse } from "@shared/api";
import type { ChatResponse } from "@/types/chat";

async function parseResponse<T>(response: Response): Promise<T> {
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError = data as ApiErrorResponse | null;
    throw new Error(apiError?.error?.message || "Unable to complete request");
  }
  return data as T;
}

export async function sendMessage(message: string, conversationId?: string): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message, conversationId }),
  });
  const data = await parseResponse<ApiChatResponse>(response);
  if (!data?.message?.content || !data.conversationId) throw new Error("Invalid response");
  return { conversationId: data.conversationId, message: data.message.content, action: data.action };
}

export async function transcribeAudio(audio: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");
  const response = await fetch("/api/transcription", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await parseResponse<TranscriptionResponse>(response);
  if (!data?.text) throw new Error("No transcript was returned");
  return data.text;
}
