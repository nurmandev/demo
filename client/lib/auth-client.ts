import { createAuthClient } from "better-auth/react";

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface SessionData {
  user: User;
  session: Session;
}

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:8080",
});

export const { signIn, signUp } = authClient;

export const signOut = async () => {
  return (authClient as any).signOut();
};

export function useSession(): {
  data: SessionData | null;
  isPending: boolean;
  error: any;
} {
  return (authClient as any).useSession();
}
