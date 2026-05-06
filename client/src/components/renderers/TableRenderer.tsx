"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { EntityConfig, PageConfig } from "@/lib/config-context";
import FormRenderer from "./FormRenderer";
import {
  Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Loader2, AlertCircle,
  FileSpreadsheet, X, Upload
} from "lucide-react";

interface TableRendererProps {
  pageConfig: PageConfig;
  entityConfig: EntityConfig;
  entityName: string;
}

interface RecordData {
  id: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export default function TableRenderer({ pageConfig, entityConfig, entityName }: TableRendererProps) {
  const params = useParams();
  const appId = params?.appId as string;
  
  const [records, setRecords] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!entityConfig) {
    return (
      <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-xl">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Configuration Error</h3>
        <p className="text-white/60">Entity "{entityName}" is missing from the application configuration.</p>
      </div>
    );
  }
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);

  const pageSize = pageConfig.pageSize || 10;
  const columns = pageConfig.columns || Object.keys(entityConfig.fields);
  const actions = pageConfig.actions || [];
  const filterFields = pageConfig.filters || [];

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {
        page: String(page),
        pageSize: String(pageSize),
      };
      if (sortBy) {
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }
      if (search.trim()) params.search = search.trim();
      if (Object.keys(filters).length > 0) {
        params.filters = JSON.stringify(filters);
      }

      const res = await api.get(`/entities/${appId}/${entityName}`, { params });
      if (res.data.success) {
        setRecords(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [appId, entityName, page, pageSize, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      setDeletingId(id);
      await api.delete(`/entities/${appId}/${entityName}/${id}`);
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === "") delete next[field];
      else next[field] = value;
      return next;
    });
    setPage(1);
  };

  const formatCellValue = (value: unknown, fieldConfig: { type: string; options?: string[] }): string => {
    if (value === undefined || value === null || value === "") return "—";
    if (fieldConfig.type === "boolean") return value ? "✓" : "✗";
    if (fieldConfig.type === "date") {
      try { return new Date(String(value)).toLocaleDateString(); } catch { return String(value); }
    }
    if (fieldConfig.type === "datetime") {
      try { return new Date(String(value)).toLocaleString(); } catch { return String(value); }
    }
    if (fieldConfig.type === "enum") {
      return String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return String(value);
  };

  const getStatusColor = (value: unknown): string => {
    const v = String(value).toLowerCase();
    if (["done", "completed", "active", "delivered"].includes(v)) return "bg-emerald-500/20 text-emerald-400";
    if (["in_progress", "review", "shipped", "confirmed"].includes(v)) return "bg-blue-500/20 text-blue-400";
    if (["todo", "planning", "pending"].includes(v)) return "bg-amber-500/20 text-amber-400";
    if (["cancelled", "on_hold", "inactive", "critical"].includes(v)) return "bg-red-500/20 text-red-400";
    if (["high"].includes(v)) return "bg-orange-500/20 text-orange-400";
    if (["medium"].includes(v)) return "bg-yellow-500/20 text-yellow-400";
    if (["low"].includes(v)) return "bg-slate-500/20 text-slate-400";
    return "bg-white/10 text-white/70";
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Search */}
          {pageConfig.searchable && (
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search..."
                className="w-full sm:w-56 lg:w-64 pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          )}

          {/* Filters */}
          {filterFields.map((field) => {
            const fieldConfig = entityConfig.fields[field];
            if (!fieldConfig || fieldConfig.type !== "enum") return null;
            return (
              <select
                key={field}
                value={filters[field] || ""}
                onChange={(e) => handleFilterChange(field, e.target.value)}
                className="w-full sm:w-auto px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="" className="bg-gray-900">All {fieldConfig.label || field}</option>
                {fieldConfig.options?.map((opt) => (
                  <option key={opt} value={opt} className="bg-gray-900">
                    {opt.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {/* CSV Import Button */}
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 text-sm font-medium transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import CSV</span>
          </button>

          {/* Create Button */}
          {actions.includes("create") && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="flex items-center gap-2 p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      ) : (
        <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
          <div className="xl:hidden p-3 grid gap-3">
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
              </div>
            ) : records.length === 0 ? (
              <div className="py-12 text-center text-white/30">
                No records found. {actions.includes("create") ? "Create your first one!" : ""}
              </div>
            ) : (
              records.map((record) => (
                <article key={record.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/35">Record</p>
                      <p className="text-sm font-medium text-white/80 break-all">{record.id.slice(0, 8)}</p>
                    </div>
                    {(actions.includes("edit") || actions.includes("delete")) && (
                      <div className="flex items-center gap-1">
                        {actions.includes("edit") && (
                          <button
                            onClick={() => setEditingRecord(record)}
                            className="p-2 hover:bg-white/10 rounded-md text-white/40 hover:text-white/80 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {actions.includes("delete") && (
                          <button
                            onClick={() => handleDelete(record.id)}
                            disabled={deletingId === record.id}
                            className="p-2 hover:bg-red-500/10 rounded-md text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === record.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {columns.map((col) => {
                      const fieldConfig = entityConfig.fields[col] || { type: "string" };
                      const value = record.data[col];
                      const isEnum = fieldConfig.type === "enum";

                      return (
                        <div key={col} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 mb-1">
                            {fieldConfig.label || col}
                          </div>
                          <div className="text-sm text-white/80">
                            {isEnum && value ? (
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                                {formatCellValue(value, fieldConfig)}
                              </span>
                            ) : fieldConfig.type === "boolean" ? (
                              <span className={value ? "text-emerald-400" : "text-white/30"}>
                                {formatCellValue(value, fieldConfig)}
                              </span>
                            ) : (
                              formatCellValue(value, fieldConfig)
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {columns.map((col) => {
                    const fieldConfig = entityConfig.fields[col];
                    return (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors select-none"
                      >
                        <span className="flex items-center gap-1.5">
                          {fieldConfig?.label || col}
                          {sortBy === col ? (
                            sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </span>
                      </th>
                    );
                  })}
                  {(actions.includes("edit") || actions.includes("delete")) && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-16 text-center text-white/30">
                      No records found. {actions.includes("create") ? "Create your first one!" : ""}
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                      {columns.map((col) => {
                        const fieldConfig = entityConfig.fields[col] || { type: "string" };
                        const value = record.data[col];
                        const isEnum = fieldConfig.type === "enum";

                        return (
                          <td key={col} className="px-4 py-3 text-sm text-white/80 whitespace-nowrap">
                            {isEnum && value ? (
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                                {formatCellValue(value, fieldConfig)}
                              </span>
                            ) : fieldConfig.type === "boolean" ? (
                              <span className={value ? "text-emerald-400" : "text-white/30"}>
                                {formatCellValue(value, fieldConfig)}
                              </span>
                            ) : (
                              formatCellValue(value, fieldConfig)
                            )}
                          </td>
                        );
                      })}
                      {(actions.includes("edit") || actions.includes("delete")) && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {actions.includes("edit") && (
                              <button
                                onClick={() => setEditingRecord(record)}
                                className="p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white/80 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {actions.includes("delete") && (
                              <button
                                onClick={() => handleDelete(record.id)}
                                disabled={deletingId === record.id}
                                className="p-1.5 hover:bg-red-500/10 rounded-md text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingId === record.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-white/10 bg-white/[0.01]">
              <p className="text-sm text-white/40 text-center sm:text-left">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 hover:bg-white/10 rounded-md text-white/50 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm text-white/60">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 hover:bg-white/10 rounded-md text-white/50 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title={`Create ${entityName}`} onClose={() => setShowCreateModal(false)}>
          <FormRenderer
            entityName={entityName}
            entityConfig={entityConfig}
            mode="create"
            onSuccess={() => { setShowCreateModal(false); fetchRecords(); }}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <Modal title={`Edit ${entityName}`} onClose={() => setEditingRecord(null)}>
          <FormRenderer
            entityName={entityName}
            entityConfig={entityConfig}
            mode="edit"
            initialData={editingRecord.data}
            recordId={editingRecord.id}
            onSuccess={() => { setEditingRecord(null); fetchRecords(); }}
            onCancel={() => setEditingRecord(null)}
          />
        </Modal>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <Modal title={`Import CSV — ${entityName}`} onClose={() => setShowCsvModal(false)} wide>
          <CsvImporter
            entityName={entityName}
            entityConfig={entityConfig}
            onSuccess={() => { setShowCsvModal(false); fetchRecords(); }}
            onCancel={() => setShowCsvModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

// ---- Modal Component ----

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm animate-in fade-in sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"} max-h-[92vh] overflow-y-auto border border-white/10 bg-gray-900 shadow-2xl rounded-t-3xl sm:rounded-2xl sm:max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

// ---- CSV Importer Component ----

function CsvImporter({
  entityName,
  entityConfig,
  onSuccess,
  onCancel,
}: {
  entityName: string;
  entityConfig: EntityConfig;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"upload" | "map" | "result">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [entityFields, setEntityFields] = useState<Array<{ name: string; label: string; type: string; required: boolean }>>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ totalRows: number; imported: number; skipped: number; errors: Array<{ row: number; field: string; message: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError(null);

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await api.post(`/csv/${entityName}/preview`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setCsvHeaders(res.data.data.csvHeaders);
        setPreviewRows(res.data.data.previewRows);
        setEntityFields(res.data.data.entityFields);
        setMapping(res.data.data.suggestedMapping || {});
        setStep("map");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to parse CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mapping", JSON.stringify(mapping));

      const res = await api.post(`/csv/${entityName}/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setResult(res.data.data);
        setStep("result");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "upload") {
    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors">
          <Upload className="w-10 h-10 text-white/30 mx-auto mb-3" />
          <p className="text-white/60 mb-2">Drop a CSV file here or click to browse</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ position: "relative" }}
          />
        </div>
        {loading && (
          <div className="flex items-center justify-center gap-2 text-white/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            Parsing CSV...
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
        )}
      </div>
    );
  }

  if (step === "map") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-white/60">Map CSV columns to entity fields:</p>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {csvHeaders.map((header) => (
            <div key={header} className="flex items-center gap-3">
              <span className="text-sm text-white/70 w-1/3 truncate" title={header}>{header}</span>
              <span className="text-white/30">→</span>
              <select
                value={mapping[header] || ""}
                onChange={(e) => setMapping((prev) => ({ ...prev, [header]: e.target.value }))}
                className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm appearance-none cursor-pointer"
              >
                <option value="" className="bg-gray-900">Skip this column</option>
                {entityFields.map((f) => (
                  <option key={f.name} value={f.name} className="bg-gray-900">
                    {f.label} ({f.type}){f.required ? " *" : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Preview */}
        {previewRows.length > 0 && (
          <div className="overflow-x-auto border border-white/10 rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/5">
                  {csvHeaders.map((h) => (
                    <th key={h} className="px-2 py-1.5 text-left text-white/40 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {csvHeaders.map((h) => (
                      <td key={h} className="px-2 py-1.5 text-white/60 truncate max-w-[120px]">{row[h] || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleImport}
            disabled={loading || Object.values(mapping).filter(Boolean).length === 0}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Import {previewRows.length > 0 ? `(${file?.name})` : ""}
          </button>
          <button onClick={onCancel} className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 text-sm font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Result step
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">{result?.totalRows || 0}</p>
          <p className="text-xs text-white/50 mt-1">Total Rows</p>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{result?.imported || 0}</p>
          <p className="text-xs text-white/50 mt-1">Imported</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{result?.skipped || 0}</p>
          <p className="text-xs text-white/50 mt-1">Skipped</p>
        </div>
      </div>

      {result?.errors && result.errors.length > 0 && (
        <div className="bg-white/5 rounded-lg p-3 max-h-40 overflow-y-auto">
          <p className="text-xs font-medium text-white/50 mb-2">Errors:</p>
          {result.errors.slice(0, 20).map((err, i) => (
            <p key={i} className="text-xs text-red-400/80">
              Row {err.row}: {err.field && `[${err.field}] `}{err.message}
            </p>
          ))}
          {result.errors.length > 20 && (
            <p className="text-xs text-white/30 mt-1">...and {result.errors.length - 20} more</p>
          )}
        </div>
      )}

      <button
        onClick={onSuccess}
        className="w-full px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors"
      >
        Done
      </button>
    </div>
  );
}
