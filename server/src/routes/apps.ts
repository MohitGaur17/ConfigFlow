import { Router, Request, Response } from "express";
import { requireAuth, optionalAuth, AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import { parseAndValidateConfig, ConfigError } from "../services/config-engine";
import { generateCodebase } from "../services/code-generator";
import JSZip from "jszip";

const router = Router();
const prisma = new PrismaClient();

// ============================================================
// Apps Routes — Create, list, delete user apps
// ============================================================

/**
 * POST /api/apps
 * Generate a new app by providing JSON config.
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

    // Validate config format
    const validatedConfig = parseAndValidateConfig(configData);

    // Save app to DB linked to user
    const app = await prisma.app.create({
      data: {
        userId: req.userId!,
        name: validatedConfig.app.name,
        config: configData as any,
      },
    });

    // Auto-seed test data for each entity so builder preview shows data immediately
    for (const [entityName, entityConfig] of Object.entries(validatedConfig.entities)) {
      const sampleData: Record<string, any> = {};
      for (const [fieldName, fieldConfig] of Object.entries(entityConfig.fields)) {
        if (fieldConfig.type === 'number') sampleData[fieldName] = 1;
        else if (fieldConfig.type === 'boolean') sampleData[fieldName] = false;
        else if (fieldConfig.type === 'date') sampleData[fieldName] = new Date().toISOString();
        else sampleData[fieldName] = `${fieldName} example`;
      }

      await prisma.record.create({
        data: {
          appId: app.id,
          entityName: entityName,
          userId: entityConfig.userScoped ? req.userId : null,
          data: sampleData as any,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: app.id,
        name: app.name,
        createdAt: app.createdAt,
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
    console.error("[Apps] Create error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/apps
 * List all apps created by the authenticated user.
 */
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const apps = await prisma.app.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: apps });
  } catch (error: any) {
    console.error("[Apps] List error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/apps/:id
 * Get details and config for a specific app.
 */
router.get("/:id", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    // If user is authenticated, ensure the app belongs to them.
    // Otherwise allow public read by app id.
    const whereClause: any = { id: req.params.id };
    if (req.userId) whereClause.userId = req.userId;

    const app = await prisma.app.findFirst({ where: whereClause });

    if (!app) {
      res.status(404).json({ success: false, error: "App not found" });
      return;
    }

    res.json({ success: true, data: app });
  } catch (error: any) {
    console.error("[Apps] Get error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * DELETE /api/apps/:id
 * Delete an app and all its records.
 */
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const app = await prisma.app.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
    });

    if (!app) {
      res.status(404).json({ success: false, error: "App not found" });
      return;
    }

    await prisma.app.delete({
      where: { id: app.id },
    });

    res.json({ success: true, data: { message: "App deleted successfully" } });
  } catch (error: any) {
    console.error("[Apps] Delete error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/apps/:id/export
 * Generates the source code for the app and returns a ZIP file.
 */
router.get("/:id/export", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const app = await prisma.app.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
    });

    if (!app) {
      res.status(404).json({ success: false, error: "App not found" });
      return;
    }

    // 1. Generate Virtual File System
    const config = app.config as any;
    const vfs = generateCodebase(config);

    // 2. Build ZIP file
    const zip = new JSZip();
    
    for (const [filePath, fileContent] of vfs.entries()) {
      zip.file(filePath, fileContent);
    }

    // 3. Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    // 4. Send as downloadable attachment
    res.setHeader("Content-Disposition", `attachment; filename="${config.app.name.toLowerCase().replace(/\s+/g, '-')}-source.zip"`);
    res.setHeader("Content-Type", "application/zip");
    res.send(zipBuffer);

  } catch (error: any) {
    console.error("[Apps] Export error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});


/**
 * GET /api/apps/:id/files
 * Returns the virtual file system (path => content) for previewing generated files.
 */
router.get("/:id/files", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const whereClause: any = { id: req.params.id };
    if (req.userId) whereClause.userId = req.userId;

    const app = await prisma.app.findFirst({ where: whereClause });
    if (!app) {
      res.status(404).json({ success: false, error: "App not found" });
      return;
    }

    const config = app.config as any;
    const vfs = generateCodebase(config);

    // Convert Map to plain object
    const obj: Record<string, string> = {};
    for (const [p, content] of vfs.entries()) obj[p] = content;

    res.json({ success: true, data: { files: obj } });
  } catch (error: any) {
    console.error("[Apps] Files error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
