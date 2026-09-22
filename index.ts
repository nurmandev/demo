import path from "node:path";
import express from "express";
import { createServer } from "./server";
import { loadEnv } from "./server/config/env";
import { connectDatabase } from "./server/config/database";
import { AiService } from "./server/services/ai.service";

const app = createServer();
const distPath = path.join(process.cwd(), "dist/spa");

app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

export default app;
