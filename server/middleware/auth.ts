import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../auth";
import type { AppEnv } from "../config/env";
import { AppError } from "../utils/errors";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export function requireAuth(env: AppEnv) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const auth = getAuth(env);
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session || !session.user) {
        throw new AppError("UNAUTHORIZED", "Authentication required to access this resource.", 401);
      }

      (req as Request & { user?: AuthenticatedUser }).user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      };

      next();
    } catch (error) {
      next(error instanceof AppError ? error : new AppError("UNAUTHORIZED", "Authentication required.", 401));
    }
  };
}
