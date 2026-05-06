"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { EntityConfig, FieldConfig } from "@/lib/config-context";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FormRendererProps {
  entityName: string;
  entityConfig: EntityConfig;
  fields?: string[];
  mode?: "create" | "edit";
  initialData?: Record<string, unknown>;
  recordId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function FormRenderer({
  entityName,
  entityConfig,
  fields,
  mode = "create",
  initialData,
  recordId,
  onSuccess,
  onCancel,
}: FormRendererProps) {
  const requestedFieldNames = fields || Object.keys(entityConfig.fields);
  const resolvedFieldEntries = requestedFieldNames.map(
    (fieldName) => [fieldName, entityConfig.fields[fieldName]] as const
  );

  const missingFields = resolvedFieldEntries
    .filter(([, fieldConfig]) => !fieldConfig)
    .map(([fieldName]) => fieldName);

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    for (const [name, config] of resolvedFieldEntries) {
      if (!config) continue;
      defaults[name] = initialData?.[name] ?? config.default ?? "";
    }
    return defaults;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const routeParams = useParams();
  const appId = routeParams?.appId as string;

  const handleChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
    setGlobalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError(null);

    try {
      // Clean empty strings to undefined for optional fields
      const cleanData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(formData)) {
        if (value !== "" && value !== undefined) {
          cleanData[key] = value;
        }
      }

      if (mode === "edit" && recordId) {
        await api.put(`/entities/${appId}/${entityName}/${recordId}`, cleanData);
      } else {
        await api.post(`/entities/${appId}/${entityName}`, cleanData);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setGlobalError(err.response?.data?.error || "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in">
        <CheckCircle2 className="w-16 h-16 text-emerald-400" />
        <p className="text-lg text-white/80">
          {mode === "edit" ? "Updated successfully!" : "Created successfully!"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5 max-w-2xl">
      {globalError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {globalError}
        </div>
      )}

      {missingFields.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Missing fields in config: {missingFields.join(", ")}. They will be rendered as generic text inputs.
        </div>
      )}

      {resolvedFieldEntries.map(([fieldName, fieldConfig]) => (
        <FieldInput
          key={fieldName}
          name={fieldName}
          config={fieldConfig}
          value={formData[fieldName]}
          error={errors[fieldName]}
          onChange={(value) => handleChange(fieldName, value)}
        />
      ))}

      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 sm:w-auto"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "edit" ? "Update" : "Create"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl bg-white/5 px-6 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 sm:w-auto"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// ---- Individual Field Inputs ----

interface FieldInputProps {
  name: string;
  config?: FieldConfig;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}

function FieldInput({ name, config, value, error, onChange }: FieldInputProps) {
  const label = config?.label || name;
  const baseInputClass = `w-full bg-white/5 border ${
    error ? "border-red-500/50" : "border-white/10"
  } rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all`;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white/70">
        {label}
        {config?.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {renderInput()}

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );

  function renderInput() {
    if (!config) {
      return (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Missing config for ${name}`}
          className={baseInputClass}
        />
      );
    }

    switch (config.type) {
      case "text":
        return (
          <textarea
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            rows={4}
            className={`${baseInputClass} resize-y`}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value === "" || value === undefined ? "" : Number(value)}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={config.placeholder}
            min={config.min}
            max={config.max}
            className={baseInputClass}
          />
        );

      case "boolean":
        return (
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white/50 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
            </div>
            <span className="text-white/50 text-sm group-hover:text-white/70 transition-colors">
              {Boolean(value) ? "Yes" : "No"}
            </span>
          </label>
        );

      case "date":
        return (
          <input
            type="date"
            value={value ? String(value).split("T")[0] : ""}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          />
        );

      case "datetime":
        return (
          <input
            type="datetime-local"
            value={value ? String(value).slice(0, 16) : ""}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          />
        );

      case "enum":
        return (
          <select
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClass} appearance-none cursor-pointer`}
          >
            <option value="" className="bg-gray-900">
              Select {label}...
            </option>
            {(config.options || []).map((opt) => (
              <option key={opt} value={opt} className="bg-gray-900">
                {opt.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        );

      case "email":
        return (
          <input
            type="email"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder || "email@example.com"}
            className={baseInputClass}
          />
        );

      case "url":
        return (
          <input
            type="url"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder || "https://..."}
            className={baseInputClass}
          />
        );

      case "relation":
        // Relation fields render as a text input for the related record ID
        // A more advanced version would fetch and show a searchable dropdown
        return (
          <input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`${config.entity || "related"} record ID`}
            className={baseInputClass}
          />
        );

      case "string":
      default:
        if (config.type !== "string") {
          return (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
              Unsupported field type "{config.type}". Using a plain text input.
              <input
                type="text"
                value={String(value ?? "")}
                onChange={(e) => onChange(e.target.value)}
                placeholder={config.placeholder}
                className={`${baseInputClass} mt-2`}
              />
            </div>
          );
        }
        return (
          <input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            className={baseInputClass}
          />
        );
    }
  }
}
