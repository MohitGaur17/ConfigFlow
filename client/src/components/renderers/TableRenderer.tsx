"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { EntityConfig, PageConfig } from "@/lib/config-context";
import FormRenderer from "./FormRenderer";
import {
  Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Loader2, AlertCircle,
  X
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

  const pageSize = pageConfig.pageSize || 10;
  const entityFields = entityConfig?.fields || {};
  const columns = pageConfig.columns || Object.keys(entityFields);
  const actions = pageConfig.actions || [];
  const filterFields = pageConfig.filters || [];
  const missingColumns = columns.filter((column) => !entityFields[column]);

  const fetchRecords = useCallback(async () => {
    if (!entityConfig) {
      return;
    }

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
    if (!entityConfig) {
      setLoading(false);
      return;
    }

    fetchRecords();
  }, [entityConfig, fetchRecords]);

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

  if (!entityConfig) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h3 className="mb-2 text-lg font-semibold text-white">Configuration Error</h3>
        <p className="text-white/60">
          Entity "{entityName}" is missing from the application configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {missingColumns.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          Missing fields in config: {missingColumns.join(", ")}. Falling back to generic display for these columns.
        </div>
      )}

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
            const fieldConfig = entityFields[field];
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
                    const fieldConfig = entityFields[col] || { type: "string", label: col };
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
                        const fieldConfig = entityFields[col] || { type: "string", label: col };
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
