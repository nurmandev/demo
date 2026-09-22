import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getMongoClient, getDatabase } from "./config/database";
import type { AppEnv } from "./config/env";

let authInstance: any = undefined;

export function getAuth(env: AppEnv) {
  if (authInstance) return authInstance;

  const db = getDatabase();
  const client = getMongoClient();

  authInstance = betterAuth({
    database: mongodbAdapter(db, {
      client,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL || "http://localhost:8080",
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    trustedOrigins: [
      env.CLIENT_ORIGIN,
      "http://localhost:8080",
      "http://localhost:3000",
      "http://127.0.0.1:8080",
    ],
  });

  return authInstance;
}
