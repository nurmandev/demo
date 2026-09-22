import { GoogleGenAI, type Content, type Part } from "@google/genai";
import type { AppEnv } from "../config/env";
import { createReminderDeclaration } from "../tools/createReminder.tool";
import { AppError } from "../utils/errors";
import type { StoredMessage } from "../repositories/conversation.repository";

const systemPrompt = `You are a concise personal assistant. Understand natural-language requests and answer conversational questions. Use createReminder when the user asks to create a reminder. Never claim an action succeeded unless the tool result confirms it. Ask for missing date, time, or reminder details instead of inventing them. Use ISO-8601 datetimes with an explicit timezone offset; the configured application timezone is authoritative.`;

export interface AiCompletionResult {
  text?: string;
  functionCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
  }>;
}

/** Retry with exponential backoff on transient Gemini errors. */
async function withRetry<T>(fn: () => Promise<T>, label: string, maxAttempts = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      const isTransient =
        msg.includes("503") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("429") ||
        msg.includes("resource_exhausted") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("model output must contain") ||
        msg.includes("cannot both be empty");

      if (!isTransient || attempt === maxAttempts) break;
      const delayMs = Math.min(1000 * 2 ** (attempt - 1), 8000);
      console.warn(`[${label}] Transient error on attempt ${attempt}/${maxAttempts}, retrying in ${delayMs}ms…`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

/**
 * Convert only user-text and model-text stored messages to Gemini Content[].
 * Tool turns are intentionally excluded — the chat sessions API handles them
 * in-session via sendMessage, so we never need to reconstruct them.
 */
function historyToContents(messages: StoredMessage[]): Content[] {
  const result: Content[] = [];
  for (const msg of messages) {
    if (msg.role === "user" && msg.content) {
      result.push({ role: "user", parts: [{ text: msg.content }] });
    } else if (msg.role === "model" && msg.content && !msg.functionCalls?.length) {
      // Only include plain model-text turns; skip model turns that are
      // purely function-call turns (they have no text and would require
      // thoughtSignature to reconstruct correctly).
      result.push({ role: "model", parts: [{ text: msg.content }] });
    }
  }
  return result;
}

export class AiService {
  private readonly client: GoogleGenAI;

  constructor(private readonly env: AppEnv) {
    this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  private get chatConfig() {
    return {
      systemInstruction: `${systemPrompt} Current timestamp: ${new Date().toISOString()}. Current timezone: ${this.env.APP_TIMEZONE}.`,
      temperature: 0.2,
      tools: [{ functionDeclarations: [createReminderDeclaration] }],
    };
  }

  /**
   * Create a Gemini Chat Session seeded with conversation history.
   * Returns a thin wrapper that sends one message and returns the parsed result.
   */
  createSession(previousMessages: StoredMessage[]) {
    const history = historyToContents(previousMessages);
    const chat = this.client.chats.create({
      model: this.env.GEMINI_MODEL,
      history,
      config: this.chatConfig,
    });

    const send = async (content: string | Part[]): Promise<AiCompletionResult> => {
      const response = await withRetry(
        () =>
          typeof content === "string"
            ? chat.sendMessage({ message: content })
            : chat.sendMessage({ message: content }),
        "Gemini chat",
      );
      const functionCalls =
        response.functionCalls && response.functionCalls.length > 0
          ? response.functionCalls.map((call) => ({
              name: call.name || "",
              args: (call.args || {}) as Record<string, unknown>,
            }))
          : undefined;
      return { text: response.text || undefined, functionCalls };
    };

    return { send };
  }

  async transcribe(file: Pick<Express.Multer.File, "buffer" | "originalname" | "mimetype">): Promise<{ text: string }> {
    try {
      const response = await withRetry(
        () =>
          this.client.models.generateContent({
            model: this.env.GEMINI_MODEL,
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { mimeType: file.mimetype, data: file.buffer.toString("base64") } },
                  { text: "Generate an accurate transcript of the speech in this audio recording. Return only the transcription text with no additional commentary, preamble, or formatting." },
                ],
              },
            ],
          }),
        "Gemini transcription",
      );
      const text = response.text?.trim();
      if (!text) throw new Error("No transcription returned");
      return { text };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Gemini transcription failed", { message });
      const lower = message.toLowerCase();
      if (lower.includes("503") || lower.includes("unavailable")) {
        throw new AppError("TRANSCRIPTION_UNAVAILABLE", "Gemini is temporarily busy. Please try again in a moment.", 503);
      }
      throw new AppError("TRANSCRIPTION_FAILED", "Unable to transcribe that recording.", 502);
    }
  }
}
