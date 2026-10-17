import { Router, Response, NextFunction } from "express";
import { requireAuth, optionalAuth, AuthRequest } from "../middleware/auth";
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
import { recordNotification } from "../services/notification-service";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

function sendValidationError(res: Response, error: ValidationError) {
  res.status(400).json({ success: false, error: error.message, errors: error.fieldErrors });
}

function queryInteger(value: unknown, field: string, fallback: number, max: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) throw new ValidationError("Invalid query parameters", { [field]: "Must be a positive integer" });
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > max) throw new ValidationError("Invalid query parameters", { [field]: `Must be between 1 and ${max}` });
  return number;
}

function parseFilters(value: unknown, fields: string[]): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new ValidationError("Invalid query parameters", { filters: "Must be a JSON object" });
  let filters: unknown;
  try { filters = JSON.parse(value); } catch { throw new ValidationError("Invalid query parameters", { filters: "Malformed JSON" }); }
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) throw new ValidationError("Invalid query parameters", { filters: "Must be a JSON object" });
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(filters as Record<string, unknown>)) {
    if (!fields.includes(key)) throw new ValidationError("Invalid query parameters", { filters: `Unknown field: ${key}` });
    if (!["string", "number", "boolean"].includes(typeof entry)) throw new ValidationError("Invalid query parameters", { filters: `Invalid value for ${key}` });
    result[key] = String(entry);
  }
  return result;
}

// ============================================================
// Dynamic Entity Routes — CRUD for any entity defined in config.
// All routes are prefixed with /api/entities/:appId/:entityName
// ============================================================

/**
 * Middleware: Verify app exists and entity exists in config.
 */
async function validateEntity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { appId, entityName } = req.params;
    const config = await getAppConfig(appId);

    if (!config) {
      res.status(404).json({
        success: false,
        error: "App not found.",
      });
      return;
    }

    const isRead = req.method === "GET";
    // Public access is an explicit entity policy and applies to reads only.
    const requestedEntity = config.entities?.[entityName];
    const publicRead = isRead && config.app?.auth?.enabled !== true && requestedEntity?.userScoped !== true && requestedEntity?.publicAccess === true;
    if (!publicRead && !req.userId) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }
    if (!publicRead) {
      const app = await prisma.app.findUnique({ where: { id: appId }, select: { userId: true } });
      if (app?.userId !== req.userId) {
        res.status(404).json({ success: false, error: "App not found." });
        return;
      }
    }

    const entityConfig = config.entities?.[entityName];
    if (!entityConfig) {
      res.status(404).json({
        success: false,
        error: `Entity "${entityName}" not found. Available entities: ${Object.keys(config.entities || {}).join(", ")}`,
      });
      return;
    }

    (req as any).appConfig = config;
    (req as any).entityConfig = entityConfig;

    next();
  } catch (error) {
    console.error("[Entity] Authorization check failed:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

/**
 * GET /api/entities/:appId/:entityName
 * List records with pagination, filtering, sorting, and search.
 */
router.get("/:appId/:entityName", optionalAuth, validateEntity, async (req: AuthRequest, res: Response) => {
  try {
    const { appId, entityName } = req.params;
    const entityConfig = (req as any).entityConfig;
    const fieldNames = Object.keys(entityConfig.fields);
    const page = queryInteger(req.query.page, "page", 1, Number.MAX_SAFE_INTEGER);
    const pageSize = queryInteger(req.query.pageSize, "pageSize", 10, 100);
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as string | undefined) || "desc";
    const search = req.query.search;
    if (search !== undefined && typeof search !== "string") throw new ValidationError("Invalid query parameters", { search: "Must be a string" });
    if (typeof search === "string" && search.length > 500) throw new ValidationError("Invalid query parameters", { search: "Must not exceed 500 characters" });
    if (sortBy && !fieldNames.includes(sortBy)) throw new ValidationError("Invalid query parameters", { sortBy: "Unknown field" });
    if (sortOrder !== "asc" && sortOrder !== "desc") throw new ValidationError("Invalid query parameters", { sortOrder: "Must be asc or desc" });

    const result = await listRecords(appId, entityName, {
      page,
      pageSize,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
      filters: parseFilters(req.query.filters, fieldNames),
      search: search as string | undefined,
      searchFields: entityConfig ? Object.keys(entityConfig.fields) : [],
      userId: req.userId,
      userScoped: entityConfig?.userScoped,
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    if (error instanceof ValidationError) return sendValidationError(res, error);
    console.error(`[Entity] List ${req.params.entityName} error:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/entities/:appId/:entityName/stats
 * Get aggregation stats for dashboard widgets.
 */
router.get("/:appId/:entityName/stats", optionalAuth, validateEntity, async (req: AuthRequest, res: Response) => {
  try {
    const { appId, entityName } = req.params;
    const entityConfig = (req as any).entityConfig;
    const { operation, field, groupBy } = req.query;
    const op = (operation as string) || "count";
    const fieldNames = Object.keys(entityConfig.fields);
    if (!["count", "sum", "avg"].includes(op)) throw new ValidationError("Invalid query parameters", { operation: "Must be count, sum, or avg" });
    if (field && !fieldNames.includes(field as string)) throw new ValidationError("Invalid query parameters", { field: "Unknown field" });
    if (groupBy && !fieldNames.includes(groupBy as string)) throw new ValidationError("Invalid query parameters", { groupBy: "Unknown field" });
    if ((op === "sum" || op === "avg") && (!field || entityConfig.fields[field as string]?.type !== "number")) {
      throw new ValidationError("Invalid query parameters", { field: "A numeric field is required for sum and avg" });
    }

    const result = await getEntityStats(
      appId,
      entityName,
      op,
      field as string,
      groupBy as string,
      req.userId,
      entityConfig?.userScoped
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof ValidationError) return sendValidationError(res, error);
    console.error(`[Entity] Stats ${req.params.entityName} error:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/entities/:appId/:entityName/recent
 * Get recent records for list widgets.
 */
router.get("/:appId/:entityName/recent", optionalAuth, validateEntity, async (req: AuthRequest, res: Response) => {
  try {
    const { appId, entityName } = req.params;
    const entityConfig = (req as any).entityConfig;
    const limit = queryInteger(req.query.limit, "limit", 5, 100);

    const result = await getRecentRecords(
      appId,
      entityName,
      limit,
      req.userId,
      entityConfig?.userScoped
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof ValidationError) return sendValidationError(res, error);
    console.error(`[Entity] Recent ${req.params.entityName} error:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/entities/:appId/:entityName/:id
 * Get a single record by ID.
 */
router.get("/:appId/:entityName/:id", optionalAuth, validateEntity, async (req: AuthRequest, res: Response) => {
  try {
    const { appId, entityName, id } = req.params;
    const entityConfig = (req as any).entityConfig;

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

    await recordNotification({
      userId: req.userId!,
      appId,
      entityName,
      type: "entity",
      title: `${entityName} created`,
      message: "A new record was created successfully.",
      sendEmail: true,
      metadata: { action: "create", recordId: record.id },
    });

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

    await recordNotification({
      userId: req.userId!,
      appId,
      entityName,
      type: "entity",
      title: `${entityName} updated`,
      message: "A record was updated successfully.",
      sendEmail: true,
      metadata: { action: "update", recordId: record.id },
    });

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

    await recordNotification({
      userId: req.userId!,
      appId,
      entityName,
      type: "entity",
      title: `${entityName} deleted`,
      message: "A record was deleted successfully.",
      sendEmail: true,
      metadata: { action: "delete", recordId: id },
    });

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
