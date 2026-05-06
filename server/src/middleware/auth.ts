import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ============================================================
// JWT Auth Middleware — Verifies tokens and attaches user
// info to the request object.
// ============================================================

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

/**
 * Generate a JWT token for a user.
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "24h" });
}

/**
 * Middleware: Require authentication.
 * Attaches userId and userEmail to the request.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Authentication required. Provide a Bearer token.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
}

/**
 * Middleware: Optional authentication.
 * If a token is present, decode it. Otherwise continue.
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
    } catch {
      // Token invalid — continue without auth
    }
  }

  next();
}
