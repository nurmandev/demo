export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function publicError(error: unknown) {
  if (error instanceof AppError) return error;
  return new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
}
