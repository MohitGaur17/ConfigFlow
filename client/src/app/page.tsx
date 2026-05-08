"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Blocks, ArrowRight, Code2, Database, LayoutTemplate, Zap } from "lucide-react";
import api from "@/lib/api";

import { useTranslation } from "@/i18n/useTranslation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PwaRegister from "@/components/PwaRegister";
import { toast } from "react-hot-toast";
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

  const { t, direction } = useTranslation();
  const handleGenerate = useCallback(async (configString: string) => {
    try {
      setIsGenerating(true);
      setError("");
      const configJson = JSON.parse(configString);

      const response = await api.post("/apps", configJson);
      if (response.data.success) {
        toast.success("Application created");
        router.push(`/builder/${response.data.data.id}`);
      }
    } catch (err: unknown) {
      let message = "Invalid JSON or server error";
      if (typeof err === "object" && err !== null) {
        const e = err as { response?: { data?: { error?: unknown } }; message?: unknown };
        if (typeof e.response?.data?.error === "string") {
          message = e.response!.data!.error as string;
        } else if (typeof e.message === "string") {
          message = e.message;
        }
      } else if (typeof err === "string") {
        message = err;
      }
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [router]);

  useEffect(() => {
    // If returning from login with a pending config, generate it
    const pendingConfig = localStorage.getItem("pending_app_config");
    if (isAuthenticated && pendingConfig) {
      localStorage.removeItem("pending_app_config");
      // defer to avoid calling setState synchronously during rendering
      setTimeout(() => handleGenerate(pendingConfig), 0);
    }
  }, [isAuthenticated, handleGenerate]);

  const handleGenerateClick = () => {
    if (!isAuthenticated) {
      localStorage.setItem("pending_app_config", jsonInput);
      router.push("/login?redirect=generate");
      return;
    }
    handleGenerate(jsonInput);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-indigo-500/30 font-sans" dir={direction === "rtl" ? "ltr" : undefined}>
      <PwaRegister />
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md fixed top-0 w-full z-50 safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Blocks className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-base md:text-lg truncate">ConfigFlow</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {loading ? null : isAuthenticated ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="text-xs md:text-sm font-medium hover:text-indigo-400 transition-colors whitespace-nowrap"
              >
                {t('nav.dashboard')}
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="text-xs md:text-sm font-medium text-white/70 hover:text-white transition-colors whitespace-nowrap"
                >
                  {t('auth.login')}
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="text-xs md:text-sm font-medium bg-white text-black px-3 md:px-4 py-1.5 md:py-2 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  {t('auth.signup')}
                </button>
              </>
            )}
                      <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-20 md:pt-32 pb-12 md:pb-16 px-4 md:px-6 safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
          
          {/* Left: Copy */}
          <div className="order-2 lg:order-1">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm text-indigo-300 mb-4 md:mb-6 ${direction === "rtl" ? "justify-end text-right self-start" : ""}`}>
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t('header.tagline')}</span>
            </div>
            <h1 className={`max-w-2xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-4 md:mb-6 ${direction === "rtl" ? "text-right" : ""}`}>
              <span className="block text-white">{t('home.title')}</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mt-2">
                {t('home.subtitle')}
              </span>
            </h1>
            <p className={`max-w-xl text-base sm:text-lg md:text-xl text-white/60 mb-6 md:mb-8 leading-relaxed ${direction === "rtl" ? "text-right" : ""}`}>
              {t('header.description')}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              <Feature rtl={direction === "rtl"} icon={<Database />} title={t('home.featureDatabase')} desc={t('home.featureDatabaseDesc')} />
              <Feature rtl={direction === "rtl"} icon={<LayoutTemplate />} title={t('home.featureNext')} desc={t('home.featureNextDesc')} />
              <Feature rtl={direction === "rtl"} icon={<Code2 />} title={t('home.featureExport')} desc={t('home.featureExportDesc')} />
            </div>
          </div>

          {/* Right: The Prompt Box (JSON Editor) */}
          <div className="relative group order-1 lg:order-2 mb-8 lg:mb-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#111111] border border-white/10 rounded-xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-80 sm:h-96 md:h-[600px]">
              
              {/* Editor Header */}
              <div className="h-10 md:h-12 bg-black/40 border-b border-white/5 flex items-center justify-between px-3 md:px-4 flex-shrink-0">
                <div className="flex gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="text-xs text-white/40 font-mono">app-config.json</div>
                <div className="w-8 md:w-10"></div>
              </div>

              {/* Editor Body */}
              <div className="flex-1 p-0 relative overflow-hidden">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full h-full bg-transparent text-xs sm:text-sm md:text-sm font-mono text-indigo-200 p-3 md:p-6 focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Editor Footer / Action */}
              <div className="p-3 md:p-4 bg-black/40 border-t border-white/5 flex-shrink-0">
                {error && <div className="text-red-400 text-xs md:text-sm mb-2 md:mb-3 px-2 truncate">{error}</div>}
                <button
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium py-2.5 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl transition-all disabled:opacity-50 text-sm md:text-base"
                >
                  {isGenerating ? t('common.loading') : t('home.newApplication')}
                  {!isGenerating && <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
              </div>
              
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function Feature({ rtl, icon, title, desc }: { rtl?: boolean; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-white/5 text-indigo-400">
        {icon}
      </div>
      <div>
        <h3 className={`font-medium text-white ${rtl ? "text-right" : ""}`}>{title}</h3>
        <p className={`text-sm text-white/50 ${rtl ? "text-right" : ""}`}>{desc}</p>
      </div>
    </div>
  );
}
