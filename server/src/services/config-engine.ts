import { PrismaClient, AppConfig as PrismaAppConfig } from "@prisma/client";
import { AppConfig, EntityConfig } from "../shared/types";
import { validateConfig } from "../shared/config-validator";

const prisma = new PrismaClient();

// ============================================================
// Config Engine — Manages config caching, loading, and entity
// syncing. Core of the config-driven architecture.
// ============================================================

// In-memory config cache
let cachedConfig: AppConfig | null = null;
let cachedConfigId: string | null = null;
let entityMap: Map<string, string> = new Map(); // entityName -> entityId

/**
 * Get the currently active and cached config.
 * Returns null if no config is loaded.
 */
export function getActiveConfig(): AppConfig | null {
  return cachedConfig;
}

/**
 * Get the cached config ID.
 */
export function getActiveConfigId(): string | null {
  return cachedConfigId;
}

/**
 * Get the entity DB ID for a given entity name.
 */
export function getEntityId(entityName: string): string | undefined {
  return entityMap.get(entityName);
}

/**
 * Get entity schema from the cached config.
 */
export function getEntityConfig(entityName: string): EntityConfig | undefined {
  return cachedConfig?.entities[entityName];
}

/**
 * Load and cache the active config from the database.
 * Called on server startup and on manual reload.
 */
export async function loadActiveConfig(): Promise<AppConfig | null> {
  const activeConfig = await prisma.appConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!activeConfig) {
    cachedConfig = null;
    cachedConfigId = null;
    entityMap.clear();
    return null;
  }

  cachedConfig = activeConfig.config as unknown as AppConfig;
  cachedConfigId = activeConfig.id;

  // Rebuild entity map
  entityMap.clear();
  const entities = await prisma.entity.findMany({
    where: { configId: activeConfig.id },
  });
  for (const entity of entities) {
    entityMap.set(entity.name, entity.id);
  }

  console.log(`[ConfigEngine] Loaded config "${cachedConfig.app.name}" with ${Object.keys(cachedConfig.entities).length} entities`);
  return cachedConfig;
}

/**
 * Upload, validate, and activate a new config.
 * This also syncs entity definitions in the database.
 */
export async function uploadConfig(
  configData: unknown
): Promise<{ config: AppConfig; configId: string; warnings: string[] }> {
  // Validate
  const validation = validateConfig(configData);
  if (!validation.success || !validation.data) {
    throw new ConfigError(
      "Invalid config",
      validation.errors || [{ path: "root", message: "Unknown error" }]
    );
  }

  const config = validation.data as unknown as AppConfig;

  // Deactivate all existing configs
  await prisma.appConfig.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Save new config
  const savedConfig = await prisma.appConfig.create({
    data: {
      name: config.app.name,
      config: configData as any,
      isActive: true,
    },
  });

  // Sync entities
  await syncEntities(savedConfig.id, config);

  // Update cache
  cachedConfig = config;
  cachedConfigId = savedConfig.id;

  return {
    config,
    configId: savedConfig.id,
    warnings: validation.warnings || [],
  };
}

/**
 * Sync entity definitions from config to the database.
 * Creates new entities, preserves existing records where possible.
 */
async function syncEntities(configId: string, config: AppConfig): Promise<void> {
  entityMap.clear();

  for (const [entityName, entityConfig] of Object.entries(config.entities)) {
    // Upsert entity
    const entity = await prisma.entity.upsert({
      where: {
        configId_name: { configId, name: entityName },
      },
      create: {
        configId,
        name: entityName,
        schema: entityConfig.fields as any,
      },
      update: {
        schema: entityConfig.fields as any,
      },
    });

    entityMap.set(entityName, entity.id);
  }

  console.log(`[ConfigEngine] Synced ${entityMap.size} entities for config ${configId}`);
}

/**
 * Get all entity names from the current config.
 */
export function getEntityNames(): string[] {
  if (!cachedConfig) return [];
  return Object.keys(cachedConfig.entities);
}

/**
 * Custom error class for config validation failures.
 */
export class ConfigError extends Error {
  public errors: Array<{ path: string; message: string }>;

  constructor(message: string, errors: Array<{ path: string; message: string }>) {
    super(message);
    this.name = "ConfigError";
    this.errors = errors;
  }
}
