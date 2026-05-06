import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { getAppConfig, getEntityConfig } from "../services/config-engine";
import {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  getEntityStats,
  getRecentRecords,
  ValidationError,
  NotFoundError,
} from "../services/entity-service";

const router = Router();

// ============================================================
// Dynamic Entity Routes — CRUD for any entity defined in config.
// All routes are prefixed with /api/entities/:appId/:entityName
// ============================================================

/**
 * Middleware: Verify app exists and entity exists in config.
 */
async function validateEntity(req: AuthRequest, res: Response, next: Function) {
  const { appId, entityName } = req.params;
  const config = await getAppConfig(appId);

  if (!config) {
    res.status(404).json({
      success: false,
      error: "App not found.",
    });
    return;
  }

  if (!config.entities[entityName]) {
    res.status(404).json({
      success: false,
      error: `Entity "${entityName}" not found. Available entities: ${Object.keys(config.entities).join(", ")}`,
    });
    return;
  }

  next();
}

/**
 * GET /api/entities/:appId/:entityName
 * List records with pagination, filtering, sorting, and search.
 */
router.get("/:appId/:entityName", requireAuth, validateEntity, async (req: AuthRequest, res: Response) => {
  try {
    const { appId, entityName } = req.params;
    const entityConfig = await getEntityConfig(appId, entityName);

    const result = await listRecords(appId, entityName, {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      filters: req.query.filters ? JSON.parse(req.query.filters as string) : undefined,
      search: req.query.search as string,
      searchFields: entityConfig ? Object.keys(entityConfig.fields) : [],
      userId: req.userId,
      userScoped: entityConfig?.userScoped,
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error(`[Entity] List ${req.params.entityName} error:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/entities/:appId/:entityName/stats
 * Get aggregation stats for dashboard widgets.
 */
router.get("/:appId/:entityName/stats", requireAuth, validateEntity, async (req: AuthRequest, res: Response) => {
  try {
    const { appId, entityName } = req.params;
    const entityConfig = await getEntityConfig(appId, entityName);
    const { operation, field, groupBy } = req.query;

    const result = await getEntityStats(
      appId,
      entityName,
      (operation as string) || "count",
      field as string,
      groupBy as string,
      req.userId,
      entityConfig?.userScoped
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error(`[Entity] Stats ${req.params.entityName} error:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/entities/:appId/:entityName/recent
 * Get recent records for list widgets.
 */
router.get("/:appId/:entityName/recent", requireAuth, validateEntity, async (req: AuthRequest, res: Response) => {
  try {
    const { appId, entityName } = req.params;
    const entityConfig = await getEntityConfig(appId, entityName);
    const limit = parseInt(req.query.limit as string) || 5;

    const result = await getRecentRecords(
      appId,
      entityName,
      limit,
      req.userId,
      entityConfig?.userScoped
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error(`[Entity] Recent ${req.params.entityName} error:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/entities/:appId/:entityName/:id
 * Get a single record by ID.
 */
router.get("/:appId/:entityName/:id", requireAuth, validateEntity, async (req: AuthRequest, res: Response) => {
  try {
    const { appId, entityName, id } = req.params;
    const entityConfig = await getEntityConfig(appId, entityName);

    const record = await getRecord(appId, entityName, id, req.userId, entityConfig?.userScoped);
    if (!record) {
      res.status(404).json({ success: false, error: "Record not found" });
      return;
    }

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error(`[Entity] Get ${req.params.entityName} error:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * POST /api/entities/:appId/:entityName
 * Create a new record.
 */
router.post("/:appId/:entityName", requireAuth, validateEntity, async (req: AuthRequest, res: Response) => {
  try {
    const { appId, entityName } = req.params;
    const record = await createRecord(appId, entityName, req.body, req.userId);

    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        errors: error.fieldErrors,
      });
      return;
    }
    console.error(`[Entity] Create ${req.params.entityName} error:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * PUT /api/entities/:appId/:entityName/:id
 * Update a record.
 */
router.put("/:appId/:entityName/:id", requireAuth, validateEntity, async (req: AuthRequest, res: Response) => {
  try {
    const { appId, entityName, id } = req.params;
    const entityConfig = await getEntityConfig(appId, entityName);

    const record = await updateRecord(appId, entityName, id, req.body, req.userId, entityConfig?.userScoped);
    res.json({ success: true, data: record });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        errors: error.fieldErrors,
      });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    console.error(`[Entity] Update ${req.params.entityName} error:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * DELETE /api/entities/:appId/:entityName/:id
 * Delete a record.
 */
router.delete("/:appId/:entityName/:id", requireAuth, validateEntity, async (req: AuthRequest, res: Response) => {
  try {
    const { appId, entityName, id } = req.params;
    const entityConfig = await getEntityConfig(appId, entityName);

    await deleteRecord(appId, entityName, id, req.userId, entityConfig?.userScoped);
    res.json({ success: true, data: { message: "Record deleted" } });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    console.error(`[Entity] Delete ${req.params.entityName} error:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
