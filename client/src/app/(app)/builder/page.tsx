"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Logo from "@/components/Logo";

export default function BuilderPage() {
  const [selectedMode, setSelectedMode] = useState<"manual" | null>("manual");
  const [submitting, setSubmitting] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };
  
  // Default Valid Starter JSON Configuration
  const [jsonConfig, setJsonConfig] = useState(
`{
  "app": {
    "name": "Project Tracker",
    "description": "Manage team projects, tasks, and deliverables.",
    "theme": {
      "primaryColor": "#FF6B00",
      "mode": "dark"
    },
    "auth": {
      "enabled": true
    }
  },
  "entities": {
    "project": {
      "displayField": "title",
      "fields": {
        "title": {
          "type": "string",
          "required": true,
          "label": "Project Title",
          "placeholder": "e.g. Website Redesign"
        },
        "description": {
          "type": "text",
          "label": "Description"
        },
        "status": {
          "type": "enum",
          "options": ["planning", "active", "completed"],
          "default": "planning",
          "label": "Status"
        },
        "dueDate": {
          "type": "date",
          "label": "Due Date"
        },
        "budget": {
          "type": "number",
          "min": 0,
          "label": "Budget ($)"
        }
      }
    }
  },
  "pages": [
    {
      "name": "Projects",
      "path": "/projects",
      "type": "table",
      "entity": "project",
      "columns": ["title", "status", "dueDate", "budget"],
      "actions": ["create", "edit", "delete"],
      "filters": ["status"],
      "searchable": true,
      "pageSize": 10
    },
    {
      "name": "New Project",
      "path": "/projects/new",
      "type": "form",
      "entity": "project",
      "submitAction": "create"
    },
    {
      "name": "Dashboard",
      "path": "/dashboard",
      "type": "dashboard",
      "widgets": [
        {
          "type": "stat",
          "label": "Total Projects",
          "entity": "project",
          "operation": "count"
        },
        {
          "type": "chart",
          "label": "Projects by Status",
          "entity": "project",
          "groupBy": "status",
          "chartType": "pie"
        },
        {
          "type": "list",
          "label": "Recent Projects",
          "entity": "project",
          "limit": 5
        }
      ]
    }
  ]
}`
  );

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      {/* Brand Navigation Bar */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-outline-hairline">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-label-tech text-on-surface-variant hover:text-primary-container transition-colors py-1 px-2.5 rounded hover:bg-surface-variant/30 border border-outline-hairline"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Projects</span>
          </Link>
          <div className="h-4 w-px bg-outline-hairline"></div>
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <Logo width={30} height={21} />
            <span className="font-headline-md text-base font-black tracking-tight text-on-surface">ConfigFlow</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-code-base text-on-surface-variant bg-surface-variant/30 border border-outline-hairline px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{user.email}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-label-tech text-on-surface-variant hover:text-white hover:bg-surface-variant/30 border border-outline-hairline transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Page Header */}
      <div className="mb-8 border-b border-outline-hairline pb-6">
        <h1 className="text-headline-lg font-headline-lg text-on-surface mb-2">Create New Project</h1>
        <p className="text-body-md text-on-surface-variant">Choose how you want to define your application architecture.</p>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Manual JSON Mode */}
        <button 
          onClick={() => setSelectedMode("manual")}
          className={`flex flex-col items-start text-left p-6 rounded-xl border transition-all duration-200 ${
            selectedMode === "manual" 
              ? "bg-primary-container/10 border-primary-container shadow-[0_0_20px_rgba(255,107,0,0.15)]" 
              : "bg-surface-elevated border-outline-hairline hover:border-outline-variant"
          }`}
        >
          <span className="material-symbols-outlined text-3xl mb-4 text-primary-container">data_object</span>
          <h3 className="text-headline-md font-headline-md text-on-surface mb-2">JSON Configuration</h3>
          <p className="text-sm font-body-md text-on-surface-variant leading-relaxed">
            Manually define your strict architecture schema, endpoints, and UI components using our standard format.
          </p>
        </button>

        {/* AI Assisted Mode (Disabled) */}
        <div className="flex flex-col items-start text-left p-6 rounded-xl border border-outline-hairline bg-surface-elevated opacity-50 cursor-not-allowed relative overflow-hidden">
          <div className="absolute top-4 right-4 px-2 py-1 rounded bg-tertiary/20 border border-tertiary/30 font-label-caps text-[10px] text-tertiary tracking-widest">
            COMING SOON
          </div>
          <span className="material-symbols-outlined text-3xl mb-4 text-on-surface-variant">auto_awesome</span>
          <h3 className="text-headline-md font-headline-md text-on-surface mb-2">AI Assisted</h3>
          <p className="text-sm font-body-md text-on-surface-variant leading-relaxed">
            Describe your application in plain English and let ConfigFlow generate the underlying schema for you.
          </p>
        </div>

      </div>

      {/* JSON Editor Area (Only shows if Manual is selected) */}
      {selectedMode === "manual" && (
        <div className="glass-panel border border-outline-hairline rounded-xl overflow-hidden flex flex-col shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Editor Header */}
          <div className="bg-surface-container-lowest border-b border-outline-hairline px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary-container">code</span>
              <span className="font-label-tech text-label-tech text-on-surface">config.json</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
              <button onClick={() => setJsonConfig("")} className="px-4 py-1.5 rounded font-label-tech text-label-tech text-on-surface-variant hover:text-on-surface transition-colors">
                Clear
              </button>
              <button 
                disabled={submitting}
                onClick={async () => {
                  try {
                    setSubmitting(true);
                    let parsed: unknown;
                    try {
                      parsed = JSON.parse(jsonConfig);
                    } catch (parseErr: any) {
                      throw new Error(`JSON Syntax Error: ${parseErr.message}`);
                    }
                    const res = await api.post("/apps", parsed);
                    if (!res.data.success) throw new Error(res.data.error || "Failed to create app");
                    toast.success("App Generated successfully!");
                    window.location.href = `/builder/${res.data.data.id}`;
                  } catch (e: any) {
                    const serverError = e.response?.data?.error;
                    const fieldErrors = e.response?.data?.errors;
                    const errorDetail = fieldErrors && Array.isArray(fieldErrors) && fieldErrors.length > 0
                      ? fieldErrors.map((err: any) => `${err.path ? err.path + ": " : ""}${err.message}`).join("\n• ")
                      : "";
                    const fullMessage = serverError
                      ? (errorDetail ? `${serverError}:\n• ${errorDetail}` : serverError)
                      : e.message;
                    alert("Failed to parse or submit JSON: " + fullMessage);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="bg-primary-container hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded font-label-tech text-label-tech transition-colors shadow-[0_0_10px_rgba(255,107,0,0.3)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">{submitting ? "refresh" : "bolt"}</span>
                {submitting ? "Generating..." : "Generate App"}
              </button>
            </div>
          </div>
          
          {/* The Textarea */}
          <div className="p-4 bg-terminal-bg">
            <textarea
              value={jsonConfig}
              onChange={(e) => setJsonConfig(e.target.value)}
              className="w-full h-[50svh] min-h-[240px] max-h-[560px] sm:h-[400px] bg-transparent text-primary font-code-base text-sm resize-y outline-none border-none focus:ring-0 leading-relaxed"
              spellCheck="false"
              placeholder="Paste your JSON configuration here..."
            />
          </div>
          
        </div>
      )}

    </div>
  );
}
