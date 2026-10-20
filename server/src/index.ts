import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import appsRoutes from "./routes/apps";
import entityRoutes from "./routes/entity";
import notificationsRoutes from "./routes/notifications";
import { PrismaClient } from "@prisma/client";
import { getJwtSecret } from "./middleware/auth";

const app = express();
const healthPrisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ============================================================
// Middleware
// ============================================================
app.use(cors({
  origin: [CLIENT_URL, "http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// ============================================================
// Routes
// ============================================================
app.use("/api/auth", authRoutes);
app.use("/api/apps", appsRoutes);
app.use("/api/entities", entityRoutes);
app.use("/api/notifications", notificationsRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Readiness requires the database connection and Prisma tables to be available.
app.get("/api/ready", async (_req, res) => {
  try {
    await Promise.all([
      healthPrisma.user.findFirst({ select: { id: true } }),
      healthPrisma.emailVerificationToken.findFirst({ select: { id: true } }),
      healthPrisma.passwordResetToken.findFirst({ select: { id: true } }),
    ]);
    res.json({ status: "ready", checks: { database: "ok" }, timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "not_ready", checks: { database: "unavailable" }, timestamp: new Date().toISOString() });
  }
});

// ============================================================
// Global Error Handler
// ============================================================
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server] Unhandled error:", err);
  if (err instanceof SyntaxError && "status" in err && (err as SyntaxError & { status?: number }).status === 400) {
    res.status(400).json({ success: false, error: "Malformed JSON request body" });
    return;
  }
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ============================================================
// Start Server
// ============================================================
let serverInstance: any = null;

async function start() {
  try {
    // Fail before accepting requests if a production secret is missing or unsafe.
    getJwtSecret();
    serverInstance = app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  start();
}

export { app, serverInstance };
