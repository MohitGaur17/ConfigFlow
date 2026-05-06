import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import configRoutes from "./routes/config";
import entityRoutes from "./routes/entity";
import csvRoutes from "./routes/csv";
import { loadActiveConfig } from "./services/config-engine";

dotenv.config();

const app = express();
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
app.use("/api/config", configRoutes);
app.use("/api/entities", entityRoutes);
app.use("/api/csv", csvRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server] Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
});

// ============================================================
// Start Server
// ============================================================
async function start() {
  try {
    // Load cached config on startup
    const config = await loadActiveConfig();
    if (config) {
      console.log(`[Server] Loaded config: "${config.app.name}"`);
    } else {
      console.log("[Server] No active config found. Upload one via POST /api/config");
    }

    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  }
}

start();
