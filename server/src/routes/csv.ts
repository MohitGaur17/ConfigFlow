import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { getAppConfig, getEntityConfig } from "../services/config-engine";
import { parseCsvHeaders, previewCsv, importCsv } from "../services/csv-service";
import multer from "multer";

const router = Router();

// Multer config: store CSV files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

// ============================================================
// CSV Routes — Upload, preview, and import CSV data
// ============================================================

/**
 * POST /api/csv/:appId/:entityName/preview
 * Upload a CSV and get headers + preview rows.
 */
router.post(
  "/:appId/:entityName/preview",
  requireAuth,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { appId, entityName } = req.params;
      const config = await getAppConfig(appId);

      if (!config || !config.entities[entityName]) {
        res.status(404).json({
          success: false,
          error: `App or Entity "${entityName}" not found`,
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No CSV file uploaded",
        });
        return;
      }

      const csvData = req.file.buffer.toString("utf-8");
      const preview = previewCsv(csvData);
      const entityConfig = await getEntityConfig(appId, entityName);

      // Get entity fields for mapping suggestions
      const entityFields = entityConfig
        ? Object.entries(entityConfig.fields).map(([name, config]) => ({
            name,
            label: config.label || name,
            type: config.type,
            required: config.required || false,
          }))
        : [];

      // Auto-suggest mappings based on name similarity
      const suggestedMapping: Record<string, string> = {};
      for (const header of preview.headers) {
        const headerLower = header.toLowerCase().replace(/[_\s-]/g, "");
        for (const field of entityFields) {
          const fieldLower = field.name.toLowerCase().replace(/[_\s-]/g, "");
          if (headerLower === fieldLower || headerLower.includes(fieldLower) || fieldLower.includes(headerLower)) {
            suggestedMapping[header] = field.name;
            break;
          }
        }
      }

      res.json({
        success: true,
        data: {
          csvHeaders: preview.headers,
          previewRows: preview.rows,
          entityFields,
          suggestedMapping,
        },
      });
    } catch (error: any) {
      console.error("[CSV] Preview error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  }
);

/**
 * POST /api/csv/:appId/:entityName/import
 * Import CSV data with column mapping.
 */
router.post(
  "/:appId/:entityName/import",
  requireAuth,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { appId, entityName } = req.params;
      const config = await getAppConfig(appId);

      if (!config || !config.entities[entityName]) {
        res.status(404).json({
          success: false,
          error: `App or Entity "${entityName}" not found`,
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No CSV file uploaded",
        });
        return;
      }

      // Parse mapping from request body
      let mapping: Record<string, string>;
      try {
        mapping = typeof req.body.mapping === "string"
          ? JSON.parse(req.body.mapping)
          : req.body.mapping;
      } catch {
        res.status(400).json({
          success: false,
          error: "Invalid mapping format. Must be a JSON object.",
        });
        return;
      }

      if (!mapping || Object.keys(mapping).length === 0) {
        res.status(400).json({
          success: false,
          error: "Column mapping is required",
        });
        return;
      }

      const csvData = req.file.buffer.toString("utf-8");

      const result = await importCsv({
        appId,
        entityName,
        csvData,
        mapping,
        userId: req.userId,
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error("[CSV] Import error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
  }
);

export default router;
