import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export type Role =
  | "platform_admin"
  | "agency_admin"
  | "caregiver"
  | "independent_caregiver"
  | "family";

/** Attach user to req if session exists. Does not block unauthenticated requests. */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const userId = (req.session as any).userId;
  if (userId) {
    const user = await storage.getUser(userId);
    (req as any).user = user ?? null;
  }
  next();
}

/** Require an authenticated session. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

/** Require one of the listed roles. Always implies requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    // platform_admin bypasses all role checks
    if (user.role === "platform_admin" || roles.includes(user.role)) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
}

/** Convenience — platform admin only. */
export const requireAdmin = requireRole("platform_admin");
