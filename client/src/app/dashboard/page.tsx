"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { Blocks, ArrowRight, Trash2, Clock, AppWindow, Plus } from "lucide-react";

import { useTranslation } from "@/i18n/useTranslation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
interface AppRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);

  const { t } = useTranslation();

  const deleteApp = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('common.confirm'))) return;
    
    try {
      await api.delete(`/apps/${id}`);
      setApps(prev => prev.filter(app => app.id !== id));
    } catch {
      alert(t('common.error'));
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const loadApps = async () => {
        try {
          const res = await api.get("/apps");
          if (res.data.success) {
            setApps(res.data.data);
          }
        } catch {
          console.error("Failed to load apps");
        } finally {
          setIsLoadingApps(false);
        }
      };
      loadApps();
    }
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) {
    return <div className="min-h-screen bg-[#0A0A0A]"></div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Top Nav */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50 safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={() => router.push("/")}>
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Blocks className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-base md:text-lg truncate">ConfigFlow</span>
          </div>
          <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
            <span className="text-xs md:text-sm text-white/50 truncate max-w-xs md:max-w-none">{user?.email}</span>
            <LanguageSwitcher />
            <button
              onClick={logout}
              className="text-xs md:text-sm text-white/70 hover:text-white transition-colors whitespace-nowrap hidden sm:inline"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 safe-area-inset-bottom">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-12 mb-8 md:mb-12">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
            <p className="text-sm md:text-base text-white/50">{t('dashboard.welcome')}</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 bg-white text-black px-4 md:px-5 py-2 md:py-2.5 rounded-full font-medium hover:bg-gray-200 transition-colors whitespace-nowrap text-sm md:text-base active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('home.newApplication')}
          </button>
        </div>

        {isLoadingApps ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl border border-white/10"></div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <AppWindow className="w-8 h-8 text-white/40" />
            </div>
            <h2 className="text-xl font-medium mb-2">{t('common.noData')}</h2>
            <p className="text-white/40 mb-6">{t('dashboard.recentTasks')}</p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              {t('home.newApplication')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map(app => (
              <div 
                key={app.id}
                onClick={() => router.push(`/builder/${app.id}`)}
                className="group relative bg-[#111111] border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-[#161616] transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <AppWindow className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={(e) => deleteApp(app.id, e)}
                    className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="text-xl font-semibold mb-2">{app.name}</h3>
                
                <div className="flex items-center gap-2 text-xs text-white/40 mt-6">
                  <Clock className="w-3 h-3" />
                  <span>{t('common.created', 'Created')} {new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                  <ArrowRight className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
