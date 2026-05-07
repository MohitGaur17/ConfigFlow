"use client";

import { useConfig } from "@/lib/config-context";
import TableRenderer from "@/components/renderers/TableRenderer";
import DashboardRenderer from "@/components/renderers/DashboardRenderer";
import FormRenderer from "@/components/renderers/FormRenderer";
import { useParams } from "next/navigation";
import { Loader2, AlertTriangle, FileQuestion } from "lucide-react";

import AppShell from "@/components/layout/AppShell";

export default function DynamicPage() {
  const params = useParams();
  const { config, loading, error } = useConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <p className="text-white/60 text-center max-w-md">
          {error || "No config loaded. Go to Config Manager to upload one."}
        </p>
      </div>
    );
  }

  // Build the path from the catch-all slug
  const slugParts = (params.slug as string[]) || [];
  let path = "/" + slugParts.join("/");

  // If at root of builder, default to the first page
  if (path === "/" && config.pages.length > 0) {
    path = config.pages[0].path;
    if (!path.startsWith("/")) path = "/" + path;
  }

  // Find matching page
  const pageConfig = config.pages.find((p) => {
    const pPath = p.path.startsWith("/") ? p.path : "/" + p.path;
    return pPath === path;
  });

  if (!pageConfig) {
    return (
      <AppShell showLanguageSwitcher={false}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FileQuestion className="w-12 h-12 text-white/20" />
          <p className="text-white/40">Page not found: {path}</p>
          <p className="text-white/20 text-sm">
            Available pages: {config.pages.map((p) => p.path).join(", ")}
          </p>
        </div>
      </AppShell>
    );
  }

  const entityConfig = pageConfig.entity ? config.entities[pageConfig.entity] : undefined;

  return (
    <AppShell showLanguageSwitcher={false}>
      <div className="animate-in">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{pageConfig.name}</h1>
          {pageConfig.entity && (
            <p className="text-sm text-white/40 mt-1">
              Entity: {pageConfig.entity}
              {entityConfig ? ` • ${Object.keys(entityConfig.fields).length} fields` : ""}
            </p>
          )}
        </div>

        {/* Render based on page type */}
        {pageConfig.type === "table" && entityConfig && pageConfig.entity && (
          <TableRenderer
            pageConfig={pageConfig}
            entityConfig={entityConfig}
            entityName={pageConfig.entity}
          />
        )}

        {pageConfig.type === "dashboard" && (
          <DashboardRenderer pageConfig={pageConfig} />
        )}

        {pageConfig.type === "form" && entityConfig && pageConfig.entity && (
          <div className="max-w-2xl">
            <FormRenderer
              entityName={pageConfig.entity}
              entityConfig={entityConfig}
              fields={pageConfig.fields}
              mode={(pageConfig.submitAction as "create" | "edit") || "create"}
            />
          </div>
        )}

        {/* Fallback for unknown types */}
        {!["table", "dashboard", "form", "detail"].includes(pageConfig.type) && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white/5 rounded-xl border border-white/10">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <p className="text-white/60">
              Unknown page type: <code className="text-amber-400">{pageConfig.type}</code>
            </p>
            <p className="text-white/30 text-sm">
              Supported types: table, form, dashboard, detail
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
