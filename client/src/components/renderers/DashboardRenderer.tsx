"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { PageConfig, EntityConfig, WidgetConfig, useConfig } from "@/lib/config-context";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Loader2, TrendingUp, Hash, Calculator, List } from "lucide-react";

const CHART_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#10b981", "#34d399", "#6ee7b7",
  "#f59e0b", "#fbbf24", "#fcd34d",
  "#ef4444", "#f87171", "#fca5a5",
];

interface DashboardRendererProps {
  pageConfig: PageConfig;
}

export default function DashboardRenderer({ pageConfig }: DashboardRendererProps) {
  const widgets = pageConfig.widgets || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {widgets.map((widget, i) => (
        <WidgetCard key={i} widget={widget} />
      ))}
    </div>
  );
}

function WidgetCard({ widget }: { widget: WidgetConfig }) {
  switch (widget.type) {
    case "stat":
      return <StatWidget widget={widget} />;
    case "chart":
      return <ChartWidget widget={widget} />;
    case "list":
      return <ListWidget widget={widget} />;
    default:
      return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-white/40 text-sm">Unknown widget type: {widget.type}</p>
        </div>
      );
  }
}

// ---- Stat Widget ----

function StatWidget({ widget }: { widget: WidgetConfig }) {
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const routeParams = useParams();
  const appId = routeParams?.appId as string;

  useEffect(() => {
    const fetchStat = async () => {
      try {
        const params: Record<string, string> = { operation: widget.operation || "count" };
        if (widget.field) params.field = widget.field;

        const res = await api.get(`/entities/${appId}/${widget.entity}/stats`, { params });
        if (res.data.success) {
          setValue(res.data.data.value);
        }
      } catch {
        setValue(0);
      } finally {
        setLoading(false);
      }
    };
    fetchStat();
  }, [appId, widget]);

  const icon = widget.operation === "count" ? Hash : widget.operation === "avg" ? Calculator : TrendingUp;
  const Icon = icon;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/50 mb-1">{widget.label}</p>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mt-2" />
          ) : (
            <p className="text-3xl font-bold text-white">
              {value?.toLocaleString() ?? "0"}
            </p>
          )}
        </div>
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
      </div>
    </div>
  );
}

// ---- Chart Widget ----

function ChartWidget({ widget }: { widget: WidgetConfig }) {
  const [data, setData] = useState<Array<{ key: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);
  const routeParams = useParams();
  const appId = routeParams?.appId as string;

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const params: Record<string, string> = {
          operation: widget.operation || "count",
          groupBy: widget.groupBy || "",
        };
        if (widget.field) params.field = widget.field;

        const res = await api.get(`/entities/${appId}/${widget.entity}/stats`, { params });
        if (res.data.success && res.data.data.groups) {
          setData(res.data.data.groups.map((g: { key: string; value: number }) => ({
            key: g.key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
            value: g.value,
          })));
        }
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChart();
  }, [appId, widget]);

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 sm:col-span-2 lg:col-span-2 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const chartType = widget.chartType || "bar";

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 sm:col-span-2 lg:col-span-2">
      <p className="text-sm font-medium text-white/70 mb-4">{widget.label}</p>
      {data.length === 0 ? (
        <p className="text-center text-white/30 py-8">No data yet</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="key"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${String(name)} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                />
              </PieChart>
            ) : chartType === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="key" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1" }} />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="key" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ---- List Widget ----

function ListWidget({ widget }: { widget: WidgetConfig }) {
  const { getEntity } = useConfig();
  const [records, setRecords] = useState<Array<{ id: string; data: Record<string, unknown>; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const routeParams = useParams();
  const appId = routeParams?.appId as string;
  const entityConfig = getEntity(widget.entity);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get(`/entities/${appId}/${widget.entity}/recent`, {
          params: { limit: widget.limit || 5 },
        });
        if (res.data.success) {
          setRecords(res.data.data);
        }
      } catch {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, [appId, widget]);

  const displayField = entityConfig?.displayField || Object.keys(entityConfig?.fields || {})[0] || "id";

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <List className="w-4 h-4 text-indigo-400" />
        <p className="text-sm font-medium text-white/70">{widget.label}</p>
      </div>
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mx-auto my-4" />
      ) : records.length === 0 ? (
        <p className="text-center text-white/30 py-4 text-sm">No records yet</p>
      ) : (
        <ul className="space-y-2">
          {records.map((record) => (
            <li
              key={record.id}
              className="flex items-center justify-between py-2 px-3 bg-white/[0.03] rounded-lg"
            >
              <span className="text-sm text-white/80 truncate">
                {String(record.data[displayField] || "Untitled")}
              </span>
              <span className="text-xs text-white/30 flex-shrink-0 ml-2">
                {new Date(record.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
