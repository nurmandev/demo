import OpenAI from "openai";
import type { AppEnv } from "../config/env";
import { createReminderDefinition } from "../tools/createReminder.tool";
import { AppError } from "../utils/errors";
import type { StoredMessage } from "../repositories/conversation.repository";

const systemPrompt = `You are a concise personal assistant. Understand natural-language requests and answer conversational questions. Use createReminder when the user asks to create a reminder. Never claim an action succeeded unless the tool result confirms it. Ask for missing date, time, or reminder details instead of inventing them. Use ISO-8601 datetimes with an explicit timezone offset; the configured application timezone is authoritative.`;

export class AiService {
  private readonly client: OpenAI;
  constructor(private readonly env: AppEnv) {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async complete(messages: StoredMessage[]) {
    try {
      return await this.client.chat.completions.create({
        model: this.env.OPENAI_MODEL,
        temperature: 0.2,
        messages: [{ role: "system", content: `${systemPrompt} Current timezone: ${this.env.APP_TIMEZONE}.` }, ...messages.map(({ timestamp: _timestamp, ...message }) => message)],
        tools: [createReminderDefinition],
        tool_choice: "auto",
      });
    } catch (error) {
      console.error("OpenAI chat request failed", { name: error instanceof Error ? error.name : "unknown" });
      throw new AppError("AI_REQUEST_FAILED", "Unable to process your request right now.", 502);
    }
  }

  async transcribe(file: Pick<Express.Multer.File, "buffer" | "originalname" | "mimetype">) {
    try {
      const upload = await OpenAI.toFile(file.buffer, file.originalname, { type: file.mimetype });
      return await this.client.audio.transcriptions.create({ file: upload, model: this.env.OPENAI_TRANSCRIPTION_MODEL });
    } catch (error) {
      console.error("OpenAI transcription failed", { name: error instanceof Error ? error.name : "unknown" });
      throw new AppError("TRANSCRIPTION_FAILED", "Unable to transcribe that recording.", 502);
    }
  }
}
