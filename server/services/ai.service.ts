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

function messagesToContents(messages: StoredMessage[]): Content[] {
  return messages.map((msg): Content => {
    if (msg.role === "user") {
      return {
        role: "user",
        parts: [{ text: msg.content || "" }],
      };
    }
    if (msg.role === "model") {
      const parts: Part[] = [];
      if (msg.functionCalls?.length) {
        for (const call of msg.functionCalls) {
          parts.push({ functionCall: { name: call.name, args: call.args } });
        }
      }
      if (msg.content) {
        parts.push({ text: msg.content });
      }
      return {
        role: "model",
        parts: parts.length > 0 ? parts : [{ text: "" }],
      };
    }
    if (msg.role === "tool" && msg.functionResponse) {
      return {
        role: "tool",
        parts: [
          {
            functionResponse: {
              name: msg.functionResponse.name,
              response: msg.functionResponse.response,
            },
          },
        ],
      };
    }
    return {
      role: "user",
      parts: [{ text: msg.content || "" }],
    };
  });
}

export class AiService {
  private readonly client: GoogleGenAI;

  constructor(private readonly env: AppEnv) {
    this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  async complete(messages: StoredMessage[]): Promise<AiCompletionResult> {
    try {
      const contents = messagesToContents(messages);
      const response = await this.client.models.generateContent({
        model: this.env.GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: `${systemPrompt} Current timestamp: ${new Date().toISOString()}. Current timezone: ${this.env.APP_TIMEZONE}.`,
          temperature: 0.2,
          tools: [{ functionDeclarations: [createReminderDeclaration] }],
        },
      });

      const functionCalls =
        response.functionCalls && response.functionCalls.length > 0
          ? response.functionCalls.map((call) => ({
              name: call.name || "",
              args: (call.args || {}) as Record<string, unknown>,
            }))
          : undefined;

      return {
        text: response.text || undefined,
        functionCalls,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Gemini chat request failed", { message });
      const lower = message.toLowerCase();
      if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")) {
        throw new AppError("AI_QUOTA_EXCEEDED", "Gemini quota or rate limit exceeded. Please check your Gemini API plan.", 502);
      }
      if (lower.includes("401") || lower.includes("403") || lower.includes("api_key_invalid") || lower.includes("api key not valid")) {
        throw new AppError("AI_AUTH_FAILED", "Invalid Gemini API key. Please check your GEMINI_API_KEY configuration.", 502);
      }
      throw new AppError("AI_REQUEST_FAILED", "Unable to process your request right now.", 502);
    }
  }

  async transcribe(file: Pick<Express.Multer.File, "buffer" | "originalname" | "mimetype">): Promise<{ text: string }> {
    try {
      const response = await this.client.models.generateContent({
        model: this.env.GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: file.mimetype,
                  data: file.buffer.toString("base64"),
                },
              },
              {
                text: "Generate an accurate transcript of the speech in this audio recording. Return only the transcription text with no additional commentary, preamble, or formatting.",
              },
            ],
          },
        ],
      });
      const text = response.text?.trim();
      if (!text) throw new Error("No transcription returned");
      return { text };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Gemini transcription failed", { message });
      throw new AppError("TRANSCRIPTION_FAILED", "Unable to transcribe that recording.", 502);
    }
  }
}
