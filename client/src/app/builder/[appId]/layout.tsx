"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { ArrowLeft, Play, Code2, Download, FileJson, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { useConfig } from "@/lib/config-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
      toast.error("Failed to export codebase");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || !isAuthenticated || !appData) {
    return <div className="min-h-screen bg-[#0A0A0A]"></div>;
  }

  return (
    <div className="min-h-[100svh] flex flex-col bg-[#0A0A0A] text-white overflow-hidden">
      
      {/* Builder Header */}
      <header className="border-b border-white/10 bg-black px-3 py-3 sm:px-4 shrink-0 z-50 shadow-2xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-2.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold tracking-tight truncate max-w-[10rem] sm:max-w-[16rem] lg:max-w-none">{appData.name}</span>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Live Preview
              </span>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex self-center lg:absolute lg:left-1/2 lg:-translate-x-1/2 bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner w-full lg:w-auto justify-between lg:justify-center">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex flex-1 lg:flex-none items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
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
            className={`flex flex-1 lg:flex-none items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
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
        <div className="flex items-center gap-3 justify-end lg:justify-start">
          <LanguageSwitcher />
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="group relative flex items-center justify-center gap-2 px-4 sm:px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-500/20 min-w-[9rem]"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
            {isExporting ? "Zipping..." : "Download ZIP"}
          </button>
        </div>
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
