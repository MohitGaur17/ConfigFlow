import { Router, Request, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import {
  getActiveConfig,
  uploadConfig,
  loadActiveConfig,
  ConfigError,
} from "../services/config-engine";

const router = Router();

// ============================================================
// Config Routes — Upload, get active config, reload cache
// ============================================================

/**
 * POST /api/config
 * Upload and activate a new config.
 */
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const configData = req.body;

    if (!configData || typeof configData !== "object") {
      res.status(400).json({
        success: false,
        error: "Request body must be a valid JSON config",
      });
      return;
    }

    const result = await uploadConfig(configData);

    res.status(201).json({
      success: true,
      data: {
        configId: result.configId,
        appName: result.config.app.name,
        entities: Object.keys(result.config.entities),
        pages: result.config.pages.map((p) => ({ name: p.name, type: p.type, path: p.path })),
        warnings: result.warnings,
      },
    });
  } catch (error: any) {
    if (error instanceof ConfigError) {
      res.status(400).json({
        success: false,
        error: error.message,
        errors: error.errors,
      });
      return;
    }
    console.error("[Config] Upload error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/config/active
 * Get the currently active config (from cache).
 */
router.get("/active", async (_req: Request, res: Response) => {
  try {
    const config = getActiveConfig();

    if (!config) {
      res.status(404).json({
        success: false,
        error: "No active config found. Upload a config first.",
      });
      return;
    }

    res.json({ success: true, data: config });
  } catch (error: any) {
    console.error("[Config] Get active error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * POST /api/config/reload
 * Manually reload the cached config from database.
 */
router.post("/reload", requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const config = await loadActiveConfig();

    if (!config) {
      res.status(404).json({
        success: false,
        error: "No active config found in database",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        appName: config.app.name,
        entities: Object.keys(config.entities),
        message: "Config reloaded successfully",
      },
    });
  } catch (error: any) {
    console.error("[Config] Reload error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
