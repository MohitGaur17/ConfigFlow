"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { ArrowLeft, Play, Code2, Download, FileJson, Loader2 } from "lucide-react";

import { useConfig } from "@/lib/config-context";
import CodeViewer from "@/components/builder/CodeViewer";

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { config } = useConfig();
  const router = useRouter();
  const params = useParams();
  const appId = params.appId as string;

  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [appData, setAppData] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (appId) {
      api.get(`/apps/${appId}`)
        .then(res => setAppData(res.data.data))
        .catch(err => console.error("Failed to fetch app data", err));
    }
  }, [appId]);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const res = await api.get(`/apps/${appId}/export`, { responseType: "blob" });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${appData?.name.replace(/\s+/g, '-').toLowerCase() || 'app'}-source.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      alert("Failed to export codebase");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || !isAuthenticated || !appData) {
    return <div className="min-h-screen bg-[#0A0A0A]"></div>;
  }

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A] text-white overflow-hidden">
      
      {/* Builder Header */}
      <header className="h-14 border-b border-white/10 bg-black flex items-center justify-between px-4 shrink-0 z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight">{appData.name}</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Live Preview
              </span>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="absolute left-1/2 -translate-x-1/2 flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "preview" 
                ? "bg-white text-black shadow-lg scale-105" 
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            <Play className={`w-4 h-4 ${activeTab === "preview" ? "fill-black" : ""}`} />
            Preview
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "code" 
                ? "bg-white text-black shadow-lg scale-105" 
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            <Code2 className="w-4 h-4" />
            Code
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="group relative flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
            {isExporting ? "Zipping..." : "Download ZIP"}
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 relative overflow-hidden bg-[#0A0A0A]">
        {activeTab === "preview" ? (
          <div className="absolute inset-0">
            {/* The children are already wrapped in AppShell at the page level */}
            {children}
          </div>
        ) : (
          <div className="absolute inset-0">
            {config && <CodeViewer config={config} />}
          </div>
        )}
      </main>

    </div>
  );
}
