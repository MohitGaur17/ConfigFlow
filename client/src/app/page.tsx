"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Blocks, ArrowRight, Code2, Database, LayoutTemplate, Zap, FileJson } from "lucide-react";
import api from "@/lib/api";

const SAMPLE_CONFIG = {
  "app": {
    "name": "Task Manager",
    "description": "Personal task tracking app",
    "theme": { "primaryColor": "#6366f1", "mode": "light" },
    "auth": { "enabled": true }
  },
  "entities": {
    "task": {
      "userScoped": true,
      "displayField": "title",
      "fields": {
        "title":       { "type": "string", "required": true, "label": "Task Title" },
        "description": { "type": "text", "label": "Description" },
        "status":      { "type": "enum", "options": ["todo", "in_progress", "done"], "default": "todo", "label": "Status" },
        "priority":    { "type": "number", "min": 1, "max": 5, "default": 3, "label": "Priority" },
        "dueDate":     { "type": "date", "label": "Due Date" },
        "isUrgent":    { "type": "boolean", "default": false, "label": "Urgent?" }
      }
    }
  },
  "pages": [
    {
      "type": "table", "name": "All Tasks", "path": "/tasks",
      "entity": "task",
      "columns": ["title", "status", "priority", "dueDate", "isUrgent"],
      "actions": ["create", "edit", "delete"],
      "filters": ["status", "priority"],
      "searchable": true,
      "pageSize": 10
    },
    {
      "type": "form", "name": "New Task", "path": "/tasks/new",
      "entity": "task",
      "fields": ["title", "description", "status", "priority", "dueDate", "isUrgent"]
    },
    {
      "type": "dashboard", "name": "Dashboard", "path": "/dashboard",
      "widgets": [
        { "type": "stat", "label": "Total Tasks", "entity": "task", "operation": "count" },
        { "type": "stat", "label": "Avg Priority", "entity": "task", "operation": "avg", "field": "priority" },
        { "type": "chart", "label": "Tasks by Status", "entity": "task", "groupBy": "status", "chartType": "pie" },
        { "type": "list", "label": "Recent Tasks", "entity": "task" }
      ]
    }
  ]
};

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState(JSON.stringify(SAMPLE_CONFIG, null, 2));
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // If returning from login with a pending config, generate it
    const pendingConfig = localStorage.getItem("pending_app_config");
    if (isAuthenticated && pendingConfig) {
      localStorage.removeItem("pending_app_config");
      handleGenerate(pendingConfig);
    }
  }, [isAuthenticated]);

  const handleGenerateClick = () => {
    if (!isAuthenticated) {
      localStorage.setItem("pending_app_config", jsonInput);
      router.push("/login?redirect=generate");
      return;
    }
    handleGenerate(jsonInput);
  };

  const handleGenerate = async (configString: string) => {
    try {
      setIsGenerating(true);
      setError("");
      const configJson = JSON.parse(configString);

      const response = await api.post("/apps", configJson);
      if (response.data.success) {
        router.push(`/builder/${response.data.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Invalid JSON or server error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-indigo-500/30 font-sans">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Blocks className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">Antigravity AI</span>
          </div>
          <div className="flex items-center gap-4">
            {loading ? null : isAuthenticated ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm font-medium hover:text-indigo-400 transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 mb-6">
              <Zap className="w-4 h-4" />
              <span>Config-Driven Architecture</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Paste JSON.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Get a Full-Stack App.
              </span>
            </h1>
            <p className="text-lg text-white/60 mb-8 leading-relaxed max-w-xl">
              Antigravity AI converts structured JSON configurations into fully working, deployed web applications. It dynamically generates forms, tables, REST APIs, and database structures instantly.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <Feature icon={<Database />} title="PostgreSQL" desc="Dynamic schemas" />
              <Feature icon={<LayoutTemplate />} title="Next.js" desc="Responsive UI" />
              <Feature icon={<Code2 />} title="Export Code" desc="Download ZIP" />
              <Feature icon={<FileJson />} title="CSV Import" desc="Built-in mapping" />
            </div>
          </div>

          {/* Right: The Prompt Box (JSON Editor) */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
              
              {/* Editor Header */}
              <div className="h-12 bg-black/40 border-b border-white/5 flex items-center justify-between px-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="text-xs text-white/40 font-mono">app-config.json</div>
                <div className="w-10"></div>
              </div>

              {/* Editor Body */}
              <div className="flex-1 p-0 relative">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full h-full bg-transparent text-sm font-mono text-indigo-200 p-6 focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Editor Footer / Action */}
              <div className="p-4 bg-black/40 border-t border-white/5">
                {error && <div className="text-red-400 text-sm mb-3 px-2">{error}</div>}
                <button
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-4 px-6 rounded-xl transition-all disabled:opacity-50"
                >
                  {isGenerating ? "Generating App..." : "Build Application"}
                  {!isGenerating && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
              
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-white/5 text-indigo-400">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-white/50">{desc}</p>
      </div>
    </div>
  );
}
