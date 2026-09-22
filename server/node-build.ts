import path from "node:path";
import http from "node:http";
import express from "express";
import { createServer } from "./index";
import { loadEnv } from "./config/env";
import { closeDatabase, connectDatabase } from "./config/database";
import { AiService } from "./services/ai.service";

async function bootstrap() {
  process.env.NODE_ENV = process.env.NODE_ENV || "production";
  const env = loadEnv();
  await connectDatabase(env);
  const app = createServer({ env, aiService: new AiService(env) });
  const __dirname = import.meta.dirname;
  const distPath = path.join(__dirname, "../spa");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "API endpoint not found." } });
      return;
    }
    res.sendFile(path.join(distPath, "index.html"));
  });

  const server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Fusion Assistant server listening on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down`);
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await closeDatabase();
    process.exit(0);
  };
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  console.error("Unable to start server", error instanceof Error ? error.message : error);
  process.exit(1);
});
