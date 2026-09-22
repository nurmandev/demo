import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  MONGODB_URI: z.string().url(),
  MONGODB_DATABASE: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:8080"),
  GEMINI_MODEL: z.string().min(1).default("gemini-flash-latest"),
  APP_TIMEZONE: z.string().min(1).default("UTC"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(): AppEnv {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid environment configuration. Check: ${missing}`);
  }
  return result.data;
}

export function hasExternalConfiguration() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.MONGODB_URI && process.env.MONGODB_DATABASE);
}
