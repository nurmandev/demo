import type { RequestHandler } from "express";
import type { AiService } from "../services/ai.service";
import { AppError } from "../utils/errors";

const allowedMimeTypes = new Set(["audio/webm", "audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/x-m4a"]);
const maxAudioBytes = 10 * 1024 * 1024;

export function createTranscriptionController(aiService: AiService): RequestHandler {
  return async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) throw new AppError("AUDIO_REQUIRED", "Please provide an audio recording.", 400);
      if (!Array.from(allowedMimeTypes).some((type) => file.mimetype === type || file.mimetype.startsWith(`${type};`))) throw new AppError("UNSUPPORTED_AUDIO", "That audio format is not supported.", 415);
      if (file.size > maxAudioBytes) throw new AppError("AUDIO_TOO_LARGE", "Audio recordings must be 10 MB or smaller.", 413);
      const result = await aiService.transcribe(file);
      res.json({ text: result.text });
    } catch (error) {
      next(error);
    }
  };
}
