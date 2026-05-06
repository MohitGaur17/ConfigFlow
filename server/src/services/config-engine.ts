import { PrismaClient } from "@prisma/client";
import { AppConfig, EntityConfig } from "../shared/types";
import { validateConfig } from "../shared/config-validator";

const prisma = new PrismaClient();

// ============================================================
// Config Engine — Manages fetching and validating configs
// for specific apps in the multi-tenant architecture.
// ============================================================

export class ConfigError extends Error {
  public errors: Array<{ path: string; message: string }>;

  constructor(message: string, errors: Array<{ path: string; message: string }>) {
    super(message);
    this.name = "ConfigError";
    this.errors = errors;
  }
}

/**
 * Validates a raw JSON config and returns the typed AppConfig.
 */
export function parseAndValidateConfig(configData: unknown): AppConfig {
  const validation = validateConfig(configData);
  if (!validation.success || !validation.data) {
    throw new ConfigError(
      "Invalid config",
      validation.errors || [{ path: "root", message: "Unknown error" }]
    );
  }
  return validation.data as unknown as AppConfig;
}

/**
 * Get the config for a specific app ID from the database.
 */
export async function getAppConfig(appId: string): Promise<AppConfig | null> {
  const app = await prisma.app.findUnique({
    where: { id: appId },
  });

  if (!app) return null;

  return app.config as unknown as AppConfig;
}

/**
 * Get the entity configuration for a specific entity in a specific app.
 */
export async function getEntityConfig(appId: string, entityName: string): Promise<EntityConfig | null> {
  const config = await getAppConfig(appId);
  if (!config || !config.entities) return null;

  return config.entities[entityName] || null;
}

/**
 * Get all entity names for a specific app.
 */
export async function getEntityNames(appId: string): Promise<string[]> {
  const config = await getAppConfig(appId);
  if (!config || !config.entities) return [];
  return Object.keys(config.entities);
}
