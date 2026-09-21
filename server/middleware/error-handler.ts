import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { AppError } from "../utils/errors";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    res.status(413).json({ error: { code: "UPLOAD_ERROR", message: "The audio upload could not be accepted." } });
    return;
  }
  const appError = error instanceof AppError ? error : new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.");
  if (!(error instanceof AppError)) console.error("Unhandled API error", { name: error instanceof Error ? error.name : "unknown" });
  res.status(appError.statusCode).json({ error: { code: appError.code, message: appError.message } });
};
