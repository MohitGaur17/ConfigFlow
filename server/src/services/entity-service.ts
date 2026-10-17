import { PrismaClient } from "@prisma/client";
import { EntityConfig, validateRecordData } from "shared";
import { getEntityConfig } from "./config-engine";

const prisma = new PrismaClient();

// ============================================================
// Entity Service — Dynamic CRUD operations for any entity.
// Handles filtering, pagination, sorting, search, and stats.
// Now scoped by appId for multi-tenant SaaS architecture.
// ============================================================

export interface ListOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string>;
  search?: string;
  searchFields?: string[];
  userId?: string;
  userScoped?: boolean;
}

export interface ListResult {
  data: Array<{ id: string; data: Record<string, unknown>; createdAt: Date; updatedAt: Date }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * List records for an entity with filtering, pagination, sorting, and search.
 */
export async function listRecords(appId: string, entityName: string, options: ListOptions): Promise<ListResult> {
  const entityConfig = await getEntityConfig(appId, entityName);
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 10));

  // Build where clause
  const where: any = { appId, entityName };

  // User scoping - unauthenticated requests must never access user-scoped records
  if (options.userScoped) {
    if (!options.userId) {
      return {
        data: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
      };
    }
    where.userId = options.userId;
  }

  // Get all records first for filtering (JSONB filtering in app layer)
  // Capped to prevent unbounded memory usage (Bug #8)
  const allRecords = await prisma.record.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  // Apply JSONB filters in application layer
  let filtered = allRecords;

  if (options.filters) {
    for (const [field, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== "" && value !== null) {
        filtered = filtered.filter((r: any) => {
          const data = r.data as Record<string, unknown>;
          return String(data[field]) === String(value);
        });
      }
    }
  }

  // Apply search
  if (options.search && options.search.trim()) {
    const searchLower = options.search.toLowerCase().trim();
    const searchFields = options.searchFields || (entityConfig ? Object.keys(entityConfig.fields) : []);

    filtered = filtered.filter((r: any) => {
      const data = r.data as Record<string, unknown>;
      return searchFields.some((field) => {
        const val = data[field];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(searchLower);
      });
    });
  }

  // Apply sorting
  if (options.sortBy) {
    const sortField = options.sortBy;
    const sortOrder = options.sortOrder || "asc";
    filtered.sort((a: any, b: any) => {
      const dataA = a.data as Record<string, unknown>;
      const dataB = b.data as Record<string, unknown>;
      const valA = dataA[sortField];
      const valB = dataB[sortField];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      let comparison = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });
  }

  // Apply pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paginatedRecords = filtered.slice(start, start + pageSize);

  return {
    data: paginatedRecords.map((r: any) => ({
      id: r.id,
      data: r.data as Record<string, unknown>,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    pagination: { page, pageSize, total, totalPages },
  };
}

/**
 * Get a single record by ID.
 */
export async function getRecord(
  appId: string,
  entityName: string,
  recordId: string,
  userId?: string,
  userScoped?: boolean
): Promise<{ id: string; data: Record<string, unknown>; createdAt: Date; updatedAt: Date } | null> {
  const where: any = { id: recordId, appId, entityName };
  if (userScoped) {
    if (!userId) return null;
    where.userId = userId;
  }

  const record = await prisma.record.findFirst({ where });
  if (!record) return null;

  return {
    id: record.id,
    data: record.data as Record<string, unknown>,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Create a new record with validation.
 */
export async function createRecord(
  appId: string,
  entityName: string,
  data: Record<string, unknown>,
  userId?: string
): Promise<{ id: string; data: Record<string, unknown> }> {
  const entityConfig = await getEntityConfig(appId, entityName);
  if (!entityConfig) throw new Error(`Entity config for "${entityName}" not found`);

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ValidationError("Validation failed", { body: "Expected a JSON object" });
  }

  if (entityConfig.userScoped && !userId) {
    throw new ValidationError("Authentication required for user-scoped entity", {
      userId: "Authentication required",
    });
  }

  // Never trust client-supplied userId in body
  const cleanData = { ...data };
  delete cleanData.userId;

  const dataWithDefaults = { ...cleanData };
  for (const [fieldName, field] of Object.entries(entityConfig.fields)) {
    if (dataWithDefaults[fieldName] === undefined && field.default !== undefined) dataWithDefaults[fieldName] = field.default;
  }

  // Validate
  const validation = validateRecordData(dataWithDefaults, entityConfig.fields as any);
  if (!validation.valid) {
    throw new ValidationError("Validation failed", validation.errors);
  }

  // Apply defaults for missing fields
  const finalData = validation.sanitized;

  const record = await prisma.record.create({
    data: {
      appId,
      entityName,
      userId: entityConfig.userScoped ? userId : null,
      data: finalData as any,
    },
  });

  return { id: record.id, data: record.data as Record<string, unknown> };
}

/**
 * Update a record with partial data validation.
 */
export async function updateRecord(
  appId: string,
  entityName: string,
  recordId: string,
  data: Record<string, unknown>,
  userId?: string,
  userScoped?: boolean
): Promise<{ id: string; data: Record<string, unknown> }> {
  const entityConfig = await getEntityConfig(appId, entityName);
  if (!entityConfig) throw new Error(`Entity config for "${entityName}" not found`);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ValidationError("Validation failed", { body: "Expected a JSON object" });
  }

  // Check record exists and belongs to user/app
  const where: any = {
    id: recordId,
    appId,
    entityName,
  };
  if (userScoped) {
    if (!userId) throw new NotFoundError("Record not found");
    where.userId = userId;
  }

  const existing = await prisma.record.findFirst({ where });
  if (!existing) throw new NotFoundError("Record not found");

  // Never trust client-supplied userId
  const cleanData = { ...data };
  delete cleanData.userId;

  // Partial validation
  const validation = validateRecordData(cleanData, entityConfig.fields as any, true);
  if (!validation.valid) {
    throw new ValidationError("Validation failed", validation.errors);
  }

  // Merge with existing data
  const existingData = existing.data as Record<string, unknown>;
  const mergedData = { ...existingData, ...validation.sanitized };

  const record = await prisma.record.update({
    where: { id: existing.id },
    data: { data: mergedData as any },
  });

  return { id: record.id, data: record.data as Record<string, unknown> };
}

/**
 * Delete a record.
 */
export async function deleteRecord(
  appId: string,
  entityName: string,
  recordId: string,
  userId?: string,
  userScoped?: boolean
): Promise<void> {
  const where: any = {
    id: recordId,
    appId,
    entityName,
  };
  if (userScoped) {
    if (!userId) throw new NotFoundError("Record not found");
    where.userId = userId;
  }

  const existing = await prisma.record.findFirst({ where });
  if (!existing) throw new NotFoundError("Record not found");

  await prisma.record.delete({ where: { id: existing.id } });
}

/**
 * Get aggregation stats for dashboard widgets.
 */
export async function getEntityStats(
  appId: string,
  entityName: string,
  operation: string,
  field?: string,
  groupBy?: string,
  userId?: string,
  userScoped?: boolean
): Promise<{ value: number; groups?: Array<{ key: string; value: number }> }> {
  const where: any = { appId, entityName };
  if (userScoped) {
    if (!userId) return { value: 0, groups: [] };
    where.userId = userId;
  }

  const records = await prisma.record.findMany({ where });

  // Count
  if (operation === "count") {
    if (groupBy) {
      const groups = groupRecords(records, groupBy);
      return { value: records.length, groups };
    }
    return { value: records.length };
  }

  // Sum / Avg
  if ((operation === "sum" || operation === "avg") && field) {
    const values = records
      .map((r: any) => {
        const data = r.data as Record<string, unknown>;
        return Number(data[field]);
      })
      .filter((v: number) => !isNaN(v));

    const sum = values.reduce((acc: number, v: number) => acc + v, 0);

    if (operation === "sum") {
      if (groupBy) {
        const groups = groupRecordsWithAgg(records, groupBy, field, "sum");
        return { value: sum, groups };
      }
      return { value: sum };
    }

    const avg = values.length > 0 ? sum / values.length : 0;
    if (groupBy) {
      const groups = groupRecordsWithAgg(records, groupBy, field, "avg");
      return { value: Math.round(avg * 100) / 100, groups };
    }
    return { value: Math.round(avg * 100) / 100 };
  }

  return { value: 0 };
}

/**
 * Get recent records for list widgets.
 */
export async function getRecentRecords(
  appId: string,
  entityName: string,
  limit: number,
  userId?: string,
  userScoped?: boolean
): Promise<Array<{ id: string; data: Record<string, unknown>; createdAt: Date }>> {
  const where: any = { appId, entityName };
  if (userScoped) {
    if (!userId) return [];
    where.userId = userId;
  }

  const records = await prisma.record.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(100, Math.max(1, Math.floor(Number.isFinite(limit) ? limit : 5))),
  });

  return records.map((r: any) => ({
    id: r.id,
    data: r.data as Record<string, unknown>,
    createdAt: r.createdAt,
  }));
}

// ---- Helpers ----

function groupRecords(
  records: Array<{ data: any }>,
  groupBy: string
): Array<{ key: string; value: number }> {
  const groups: Record<string, number> = {};
  for (const record of records) {
    const data = record.data as Record<string, unknown>;
    const key = String(data[groupBy] || "unknown");
    groups[key] = (groups[key] || 0) + 1;
  }
  return Object.entries(groups).map(([key, value]) => ({ key, value }));
}

function groupRecordsWithAgg(
  records: Array<{ data: any }>,
  groupBy: string,
  field: string,
  agg: "sum" | "avg"
): Array<{ key: string; value: number }> {
  const groups: Record<string, number[]> = {};
  for (const record of records) {
    const data = record.data as Record<string, unknown>;
    const key = String(data[groupBy] || "unknown");
    const val = Number(data[field]);
    if (!isNaN(val)) {
      if (!groups[key]) groups[key] = [];
      groups[key].push(val);
    }
  }

  return Object.entries(groups).map(([key, values]) => {
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      key,
      value: agg === "avg" ? Math.round((sum / values.length) * 100) / 100 : sum,
    };
  });
}

// ---- Error Classes ----

export class ValidationError extends Error {
  public fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string>) {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
