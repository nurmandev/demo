import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import type { AppEnv } from "./config/env";
import { hasExternalConfiguration, loadEnv } from "./config/env";
import { connectDatabase, isDatabaseConnected } from "./config/database";
import { AiService } from "./services/ai.service";
import { ChatService } from "./services/chat.service";
import { chatRouter } from "./routes/chat";
import { transcriptionRouter } from "./routes/transcription";
import { AppError } from "./utils/errors";
import { errorHandler } from "./middleware/error-handler";

export function createServer(options: { env?: AppEnv; aiService?: AiService } = {}) {
  const app = express();
  const configuredRuntime = options.aiService
    ? Promise.resolve({ aiService: options.aiService, chatService: new ChatService(options.aiService) })
    : undefined;
  let runtimePromise = configuredRuntime;
  const getRuntime = () => {
    if (!runtimePromise) {
      runtimePromise = (async () => {
        const env = loadEnv();
        try {
          await connectDatabase(env);
        } catch (error) {
          console.error("MongoDB connection failed", { message: error instanceof Error ? error.message : String(error) });
          throw new AppError("DATABASE_UNAVAILABLE", "The database is unavailable. Please try again later.", 503);
        }
        const aiService = new AiService(env);
        return { aiService, chatService: new ChatService(aiService) };
      })().catch((error) => {
        runtimePromise = undefined;
        throw error;
      });
    }
    return runtimePromise;
  };

  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "production"
          ? {
              directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "img-src": ["'self'", "data:", "blob:", "https:"],
                "connect-src": ["'self'", "https:", "wss:", "ws:"],
              },
            }
          : false,
    })
  );
  app.use(cors({ origin: options.env?.CLIENT_ORIGIN || process.env.CLIENT_ORIGIN || "http://localhost:8080" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.get("/api/health", async (_req, res) => {
    const configured = options.env ? true : hasExternalConfiguration();
    if (configured && !isDatabaseConnected()) {
      try {
        await getRuntime();
      } catch {
        // Retain degraded status below
      }
    }
    res.status(configured && isDatabaseConnected() ? 200 : 503).json({
      status: configured && isDatabaseConnected() ? "ok" : "degraded",
      database: isDatabaseConnected() ? "connected" : configured ? "disconnected" : "not_configured",
    });
  });

  app.use("/api", async (req, res, next) => {
    if (req.path !== "/chat" && req.path !== "/transcription") return next();
    try {
      const runtime = await getRuntime();
      const router = req.path === "/chat" ? chatRouter(runtime.chatService) : transcriptionRouter(runtime.aiService);
      return router(req, res, next);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("SERVICE_NOT_CONFIGURED", "The backend is not configured for AI requests.", 503));
    }
  });

  app.use(errorHandler);
  return app;
}
