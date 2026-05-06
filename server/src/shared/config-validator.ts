import { z } from "zod";

// ============================================================
// Zod schemas for runtime validation of JSON configs.
// Used by both server (config upload) and client (config load).
// ============================================================

const fieldTypeEnum = z.enum([
  "string", "text", "number", "boolean", "date", "datetime",
  "email", "url", "enum", "relation",
]);

const fieldConfigSchema = z.object({
  type: fieldTypeEnum,
  required: z.boolean().optional().default(false),
  default: z.unknown().optional(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  entity: z.string().optional(),
  pattern: z.string().optional(),
}).refine(
  (data) => {
    // enum fields must have options
    if (data.type === "enum" && (!data.options || data.options.length === 0)) {
      return false;
    }
    // relation fields must have entity
    if (data.type === "relation" && !data.entity) {
      return false;
    }
    return true;
  },
  { message: "Enum fields require 'options', relation fields require 'entity'" }
);

const entityConfigSchema = z.object({
  fields: z.record(z.string(), fieldConfigSchema).refine(
    (fields) => Object.keys(fields).length > 0,
    { message: "Entity must have at least one field" }
  ),
  displayField: z.string().optional(),
  userScoped: z.boolean().optional().default(false),
});

const widgetConfigSchema = z.object({
  type: z.enum(["stat", "chart", "list"]),
  label: z.string(),
  entity: z.string(),
  operation: z.enum(["count", "sum", "avg"]).optional(),
  field: z.string().optional(),
  groupBy: z.string().optional(),
  chartType: z.enum(["bar", "pie", "line"]).optional(),
  limit: z.number().positive().optional(),
});

const tablePageSchema = z.object({
  type: z.literal("table"),
  name: z.string(),
  path: z.string(),
  entity: z.string(),
  columns: z.array(z.string()).min(1),
  actions: z.array(z.enum(["create", "edit", "delete"])).optional(),
  filters: z.array(z.string()).optional(),
  searchable: z.boolean().optional(),
  pageSize: z.number().positive().optional().default(10),
});

const formPageSchema = z.object({
  type: z.literal("form"),
  name: z.string(),
  path: z.string(),
  entity: z.string(),
  fields: z.array(z.string()).optional(),
  submitAction: z.enum(["create", "edit"]).optional().default("create"),
});

const dashboardPageSchema = z.object({
  type: z.literal("dashboard"),
  name: z.string(),
  path: z.string(),
  widgets: z.array(widgetConfigSchema).min(1),
});

const detailPageSchema = z.object({
  type: z.literal("detail"),
  name: z.string(),
  path: z.string(),
  entity: z.string(),
  fields: z.array(z.string()).optional(),
});

const pageConfigSchema = z.discriminatedUnion("type", [
  tablePageSchema,
  formPageSchema,
  dashboardPageSchema,
  detailPageSchema,
]);

const appMetaSchema = z.object({
  name: z.string().min(1, "App name is required"),
  description: z.string().optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    mode: z.enum(["light", "dark"]).optional(),
  }).optional(),
  auth: z.object({
    enabled: z.boolean(),
  }),
});

export const appConfigSchema = z.object({
  app: appMetaSchema,
  entities: z.record(z.string(), entityConfigSchema).refine(
    (entities) => Object.keys(entities).length > 0,
    { message: "Config must define at least one entity" }
  ),
  pages: z.array(pageConfigSchema).min(1, "Config must define at least one page"),
});

// ---- Validation helpers ----

export interface ValidationResult {
  success: boolean;
  data?: z.infer<typeof appConfigSchema>;
  errors?: Array<{ path: string; message: string }>;
  warnings?: string[];
}

/**
 * Validate a JSON config against the schema.
 * Returns normalized data or structured errors.
 */
export function validateConfig(config: unknown): ValidationResult {
  const result = appConfigSchema.safeParse(config);

  if (result.success) {
    const warnings = collectWarnings(result.data);
    return { success: true, data: result.data, warnings };
  }

  const errors = result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  return { success: false, errors };
}

/**
 * Collect non-fatal warnings about the config
 * (e.g., displayField doesn't exist in entity fields).
 */
function collectWarnings(config: z.infer<typeof appConfigSchema>): string[] {
  const warnings: string[] = [];
  const entityNames = Object.keys(config.entities);

  // Check displayField references
  for (const [name, entity] of Object.entries(config.entities)) {
    if (entity.displayField && !(entity.displayField in entity.fields)) {
      warnings.push(
        `Entity "${name}": displayField "${entity.displayField}" is not defined in fields. Will use first field.`
      );
    }

    // Check relation targets
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      if (field.type === "relation" && field.entity && !entityNames.includes(field.entity)) {
        warnings.push(
          `Entity "${name}": field "${fieldName}" references unknown entity "${field.entity}".`
        );
      }
    }
  }

  // Check page entity references
  for (const page of config.pages) {
    if ("entity" in page && !entityNames.includes(page.entity)) {
      warnings.push(
        `Page "${page.name}": references unknown entity "${page.entity}".`
      );
    }

    // Check column/field references
    if (page.type === "table") {
      const entity = config.entities[page.entity];
      if (entity) {
        for (const col of page.columns) {
          if (!(col in entity.fields)) {
            warnings.push(
              `Page "${page.name}": column "${col}" is not defined in entity "${page.entity}".`
            );
          }
        }
      }
    }

    // Check widget entity references
    if (page.type === "dashboard") {
      for (const widget of page.widgets) {
        if (!entityNames.includes(widget.entity)) {
          warnings.push(
            `Dashboard "${page.name}": widget "${widget.label}" references unknown entity "${widget.entity}".`
          );
        }
      }
    }
  }

  return warnings;
}

/**
 * Validate a single record's data against an entity schema.
 * Used for CRUD operations.
 */
export function validateRecordData(
  data: Record<string, unknown>,
  fields: Record<string, { type: string; required?: boolean; options?: string[]; min?: number; max?: number; pattern?: string }>,
  isPartial = false
): { valid: boolean; errors: Record<string, string>; sanitized: Record<string, unknown> } {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, unknown> = {};

  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    const value = data[fieldName];

    // Check required
    if (fieldConfig.required && !isPartial && (value === undefined || value === null || value === "")) {
      errors[fieldName] = `${fieldName} is required`;
      continue;
    }

    // Skip if not provided (optional or partial update)
    if (value === undefined || value === null) {
      if (fieldConfig.required !== true || isPartial) continue;
    }

    // Type validation
    if (value !== undefined && value !== null && value !== "") {
      switch (fieldConfig.type) {
        case "string":
        case "text":
        case "email":
        case "url":
          sanitized[fieldName] = String(value);
          if (fieldConfig.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
            errors[fieldName] = `${fieldName} must be a valid email`;
          }
          if (fieldConfig.type === "url" && !/^https?:\/\/.+/.test(String(value))) {
            errors[fieldName] = `${fieldName} must be a valid URL`;
          }
          if (fieldConfig.pattern) {
            try {
              if (!new RegExp(fieldConfig.pattern).test(String(value))) {
                errors[fieldName] = `${fieldName} does not match required pattern`;
              }
            } catch {
              // Invalid regex in config — skip pattern validation
            }
          }
          break;

        case "number": {
          const num = Number(value);
          if (isNaN(num)) {
            errors[fieldName] = `${fieldName} must be a number`;
          } else {
            if (fieldConfig.min !== undefined && num < fieldConfig.min) {
              errors[fieldName] = `${fieldName} must be at least ${fieldConfig.min}`;
            }
            if (fieldConfig.max !== undefined && num > fieldConfig.max) {
              errors[fieldName] = `${fieldName} must be at most ${fieldConfig.max}`;
            }
            sanitized[fieldName] = num;
          }
          break;
        }

        case "boolean":
          sanitized[fieldName] = value === true || value === "true" || value === 1;
          break;

        case "date":
        case "datetime": {
          const date = new Date(String(value));
          if (isNaN(date.getTime())) {
            errors[fieldName] = `${fieldName} must be a valid date`;
          } else {
            sanitized[fieldName] = date.toISOString();
          }
          break;
        }

        case "enum":
          if (fieldConfig.options && !fieldConfig.options.includes(String(value))) {
            errors[fieldName] = `${fieldName} must be one of: ${fieldConfig.options.join(", ")}`;
          } else {
            sanitized[fieldName] = String(value);
          }
          break;

        case "relation":
          sanitized[fieldName] = String(value);
          break;

        default:
          // Unknown type — treat as string
          sanitized[fieldName] = String(value);
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}
