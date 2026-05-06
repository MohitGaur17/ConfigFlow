"use client";

import React, { useState } from "react";
import { useConfig } from "@/lib/config-context";
import { Upload, RefreshCw, CheckCircle2, AlertCircle, Loader2, FileJson, Blocks } from "lucide-react";

// Bundled sample configs
import taskManagerConfig from "@/configs/task-manager.json";
import inventoryConfig from "@/configs/inventory.json";

const SAMPLE_CONFIGS = [
  { name: "Task Manager", description: "Project tasks, statuses, priorities", config: taskManagerConfig, color: "from-indigo-500 to-purple-600" },
  { name: "Inventory Pro", description: "Products, suppliers, orders", config: inventoryConfig, color: "from-emerald-500 to-teal-600" },
];

export default function ConfigManagerPage() {
  const { config, uploadConfig, reloadConfig, loading: configLoading } = useConfig();
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleUpload = async (configData: unknown, name?: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setWarnings([]);

    try {
      const result = await uploadConfig(configData);
      setSuccess(`Config "${name || "Custom"}" loaded successfully!`);
      setWarnings(result.warnings);
      setJsonInput("");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleJsonUpload = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      handleUpload(parsed, parsed.app?.name);
    } catch {
      setError("Invalid JSON. Please check your input.");
    }
  };

  const handleReload = async () => {
    setLoading(true);
    try {
      await reloadConfig();
      setSuccess("Config reloaded from cache!");
    } catch {
      setError("Reload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Config Manager</h1>
        <p className="text-sm text-white/40 mt-1">Upload, switch, or reload application configs</p>
      </div>

      {/* Current Config Status */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Active Config</p>
            {config ? (
              <div>
                <p className="text-lg font-semibold text-white">{config.app.name}</p>
                <p className="text-sm text-white/40">
                  {Object.keys(config.entities).length} entities • {config.pages.length} pages
                </p>
              </div>
            ) : (
              <p className="text-white/50">No config loaded</p>
            )}
          </div>
          <button
            onClick={handleReload}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Reload
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm space-y-1">
          {warnings.map((w, i) => (
            <p key={i}>⚠️ {w}</p>
          ))}
        </div>
      )}

      {/* Sample Configs */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Sample Configs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SAMPLE_CONFIGS.map((sample) => (
            <button
              key={sample.name}
              onClick={() => handleUpload(sample.config, sample.name)}
              disabled={loading}
              className="text-left bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] hover:border-white/20 transition-all group disabled:opacity-50"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${sample.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Blocks className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{sample.name}</p>
                  <p className="text-sm text-white/40 mt-0.5">{sample.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom JSON Upload */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Custom Config (JSON)</h2>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Paste your JSON config here...\n{\n  "app": { "name": "My App", ... },\n  "entities": { ... },\n  "pages": [ ... ]\n}'
            rows={12}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-mono placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
          />
          <button
            onClick={handleJsonUpload}
            disabled={loading || !jsonInput.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Config
          </button>
        </div>
      </div>
    </div>
  );
}
