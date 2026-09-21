import { Router } from "express";
import multer from "multer";
import { createTranscriptionController } from "../controllers/transcription.controller";
import type { AiService } from "../services/ai.service";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });

export function transcriptionRouter(aiService: AiService) {
  const router = Router();
  router.post("/transcription", upload.single("audio"), createTranscriptionController(aiService));
  return router;
}
