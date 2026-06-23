// ============================================================
// Shared Types for AI App Generator
// These types define the JSON config schema that drives the
// entire system — UI, APIs, database, and auth.
// ============================================================

// ---- Field Types ----

export type FieldType =
  | "string"
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "url"
  | "enum"
  | "relation";

export interface FieldConfig {
  type: FieldType;
  required?: boolean;
  default?: unknown;
  label?: string;
  placeholder?: string;
  // enum
  options?: string[];
  // number
  min?: number;
  max?: number;
  // relation
  entity?: string;
  // string
  pattern?: string;
}

// ---- Entity ----

export interface EntityConfig {
  fields: Record<string, FieldConfig>;
  displayField?: string;
  userScoped?: boolean;
}

// ---- Page Types ----

export interface TablePageConfig {
  type: "table";
  name: string;
  path: string;
  entity: string;
  columns: string[];
  actions?: ("create" | "edit" | "delete")[];
  filters?: string[];
  searchable?: boolean;
  pageSize?: number;
}

export interface FormPageConfig {
  type: "form";
  name: string;
  path: string;
  entity: string;
  fields?: string[];
  submitAction?: "create" | "edit";
}

export interface WidgetConfig {
  type: "stat" | "chart" | "list";
  label: string;
  entity: string;
  operation?: "count" | "sum" | "avg";
  field?: string;
  groupBy?: string;
  chartType?: "bar" | "pie" | "line";
  limit?: number;
}

export interface DashboardPageConfig {
  type: "dashboard";
  name: string;
  path: string;
  widgets: WidgetConfig[];
}

export interface DetailPageConfig {
  type: "detail";
  name: string;
  path: string;
  entity: string;
  fields?: string[];
}

export type PageConfig =
  | TablePageConfig
  | FormPageConfig
  | DashboardPageConfig
  | DetailPageConfig;

// ---- App Config (Root) ----

export interface ThemeConfig {
  primaryColor?: string;
  mode?: "light" | "dark";
}

export interface AuthConfig {
  enabled: boolean;
  providers?: {
    google?: boolean;
    github?: boolean;
  };
}

export interface AppMeta {
  name: string;
  description?: string;
  theme?: ThemeConfig;
  auth: AuthConfig;
}

export interface AppConfig {
  app: AppMeta;
  entities: Record<string, EntityConfig>;
  pages: PageConfig[];
}

// ---- API Response Types ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface StatsResult {
  operation: string;
  field?: string;
  value: number;
  groupBy?: string;
  groups?: Array<{ key: string; value: number }>;
}

// ---- Auth Types ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
