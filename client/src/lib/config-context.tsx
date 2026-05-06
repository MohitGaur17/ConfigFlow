"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "./api";

// ============================================================
// Config Context — Loads and caches the active app config.
// All dynamic rendering reads from this context.
// ============================================================

interface FieldConfig {
  type: string;
  required?: boolean;
  default?: unknown;
  label?: string;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  entity?: string;
  pattern?: string;
}

interface EntityConfig {
  fields: Record<string, FieldConfig>;
  displayField?: string;
  userScoped?: boolean;
}

interface PageConfig {
  type: string;
  name: string;
  path: string;
  entity?: string;
  columns?: string[];
  actions?: string[];
  filters?: string[];
  searchable?: boolean;
  pageSize?: number;
  fields?: string[];
  submitAction?: string;
  widgets?: WidgetConfig[];
}

interface WidgetConfig {
  type: string;
  label: string;
  entity: string;
  operation?: string;
  field?: string;
  groupBy?: string;
  chartType?: string;
  limit?: number;
}

interface AppConfig {
  app: {
    name: string;
    description?: string;
    theme?: { primaryColor?: string; mode?: string };
    auth: { enabled: boolean };
  };
  entities: Record<string, EntityConfig>;
  pages: PageConfig[];
}

interface ConfigContextType {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
  reloadConfig: () => Promise<void>;
  uploadConfig: (configData: unknown) => Promise<{ warnings: string[] }>;
  getEntity: (name: string) => EntityConfig | undefined;
  getPageByPath: (path: string) => PageConfig | undefined;
  getPages: () => PageConfig[];
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/config/active");
      if (res.data.success) {
        setConfig(res.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setConfig(null);
        setError("No config loaded. Upload a config to get started.");
      } else {
        setError(err.response?.data?.error || "Failed to load config");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const reloadConfig = useCallback(async () => {
    await fetchConfig();
  }, [fetchConfig]);

  const uploadConfig = useCallback(async (configData: unknown) => {
    const res = await api.post("/config", configData);
    if (res.data.success) {
      await fetchConfig();
      return { warnings: res.data.data.warnings || [] };
    }
    throw new Error(res.data.error || "Failed to upload config");
  }, [fetchConfig]);

  const getEntity = useCallback(
    (name: string) => config?.entities[name],
    [config]
  );

  const getPageByPath = useCallback(
    (path: string) => config?.pages.find((p) => p.path === path),
    [config]
  );

  const getPages = useCallback(() => config?.pages || [], [config]);

  return (
    <ConfigContext.Provider
      value={{
        config,
        loading,
        error,
        reloadConfig,
        uploadConfig,
        getEntity,
        getPageByPath,
        getPages,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfig must be used within ConfigProvider");
  return context;
}

export type { AppConfig, PageConfig, EntityConfig, FieldConfig, WidgetConfig };
