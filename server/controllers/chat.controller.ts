import type { RequestHandler } from "express";
import { chatRequestSchema } from "../schemas/chat.schema";
import { AppError } from "../utils/errors";
import type { ChatService } from "../services/chat.service";

export function createChatController(service: ChatService): RequestHandler {
  return async (req, res, next) => {
    try {
      const parsed = chatRequestSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError("INVALID_REQUEST", "Message must be between 1 and 4000 characters.", 400);
      res.json(await service.send(parsed.data.message, parsed.data.conversationId));
    } catch (error) {
      next(error);
    }
  };
}
