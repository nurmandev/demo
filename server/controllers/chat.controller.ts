import type { RequestHandler, Request } from "express";
import { chatRequestSchema } from "../schemas/chat.schema";
import { AppError } from "../utils/errors";
import type { ChatService } from "../services/chat.service";
import type { AuthenticatedUser } from "../middleware/auth";

export function createChatController(service: ChatService): RequestHandler {
  return async (req, res, next) => {
    try {
      const parsed = chatRequestSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError("INVALID_REQUEST", "Message must be between 1 and 4000 characters.", 400);
      const user = (req as Request & { user?: AuthenticatedUser }).user;
      res.json(await service.send(parsed.data.message, parsed.data.conversationId, user?.id));
    } catch (error) {
      next(error);
    }
  };
}
