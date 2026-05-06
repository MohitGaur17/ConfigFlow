import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateToken, requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// ============================================================
// Auth Routes — Register, Login, Get Current User
// ============================================================

/**
 * POST /api/auth/register
 * Create a new user account.
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
      return;
    }

    // Check email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: "Email already registered",
      });
      return;
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: name || null },
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    });
  } catch (error: any) {
    console.error("[Auth] Register error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * POST /api/auth/login
 * Authenticate and return a JWT token.
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    });
  } catch (error: any) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/auth/me
 * Get the current authenticated user.
 */
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error("[Auth] Me error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
