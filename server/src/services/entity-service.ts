import { PrismaClient } from "@prisma/client";
import { EntityConfig, FieldConfig } from "../shared/types";
import { validateRecordData } from "../shared/config-validator";
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

  // User scoping
  if (options.userScoped && options.userId) {
    where.userId = options.userId;
  }

  // Get all records first for filtering (JSONB filtering in app layer)
  const allRecords = await prisma.record.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Apply JSONB filters in application layer
  let filtered = allRecords;

  if (options.filters) {
    for (const [field, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== "" && value !== null) {
        filtered = filtered.filter((r) => {
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

    filtered = filtered.filter((r) => {
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
    filtered.sort((a, b) => {
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
    data: paginatedRecords.map((r) => ({
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
  if (userScoped && userId) {
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

  // Validate
  const validation = validateRecordData(data, entityConfig.fields as any);
  if (!validation.valid) {
    throw new ValidationError("Validation failed", validation.errors);
  }

  // Apply defaults for missing fields
  const finalData = applyDefaults(validation.sanitized, entityConfig.fields);

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

  // Check record exists and belongs to user/app
  const existing = await prisma.record.findFirst({
    where: {
      id: recordId,
      appId,
      entityName,
      ...(userScoped && userId ? { userId } : {}),
    },
  });
  if (!existing) throw new NotFoundError("Record not found");

  // Partial validation
  const validation = validateRecordData(data, entityConfig.fields as any, true);
  if (!validation.valid) {
    throw new ValidationError("Validation failed", validation.errors);
  }

  // Merge with existing data
  const existingData = existing.data as Record<string, unknown>;
  const mergedData = { ...existingData, ...validation.sanitized };

  const record = await prisma.record.update({
    where: { id: recordId },
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
  const existing = await prisma.record.findFirst({
    where: {
      id: recordId,
      appId,
      entityName,
      ...(userScoped && userId ? { userId } : {}),
    },
  });
  if (!existing) throw new NotFoundError("Record not found");

  await prisma.record.delete({ where: { id: recordId } });
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
  if (userScoped && userId) {
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
      .map((r) => {
        const data = r.data as Record<string, unknown>;
        return Number(data[field]);
      })
      .filter((v) => !isNaN(v));

    const sum = values.reduce((acc, v) => acc + v, 0);

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
  if (userScoped && userId) {
    where.userId = userId;
  }

  const records = await prisma.record.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return records.map((r) => ({
    id: r.id,
    data: r.data as Record<string, unknown>,
    createdAt: r.createdAt,
  }));
}

// ---- Helpers ----

function applyDefaults(
  data: Record<string, unknown>,
  fields: Record<string, FieldConfig>
): Record<string, unknown> {
  const result = { ...data };
  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    if (result[fieldName] === undefined && fieldConfig.default !== undefined) {
      result[fieldName] = fieldConfig.default;
    }
  }
  return result;
}

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
