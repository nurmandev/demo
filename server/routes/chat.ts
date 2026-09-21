import { Router } from "express";
import { createChatController } from "../controllers/chat.controller";
import type { ChatService } from "../services/chat.service";

export function chatRouter(service: ChatService) {
  const router = Router();
  router.post("/chat", createChatController(service));
  return router;
}
