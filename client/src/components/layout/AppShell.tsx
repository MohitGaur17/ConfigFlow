"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useConfig } from "@/lib/config-context";
import {
  LayoutDashboard, Table, FormInput, FileText, Menu, X,
  LogOut, Settings, Blocks, ChevronRight, User,
} from "lucide-react";

const PAGE_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  table: Table,
  form: FormInput,
  detail: FileText,
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { config } = useConfig();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pages = config?.pages || [];
  const appName = config?.app.name || "AI App Generator";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-40 lg:static inset-y-0 left-0 w-64 bg-gray-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Blocks className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white truncate">{appName}</h1>
            <p className="text-[10px] text-white/30">Config-Driven Runtime</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-white/10 rounded-md text-white/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {pages.map((page) => {
            const Icon = PAGE_ICONS[page.type] || FileText;
            const isActive = pathname === `/app${page.path}`;

            return (
              <Link
                key={page.path}
                href={`/app${page.path}`}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{page.name}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Config Manager Link */}
        <div className="px-3 py-2 border-t border-white/5">
          <Link
            href="/app/config"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/app/config"
                ? "bg-indigo-500/15 text-indigo-400"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Config Manager</span>
          </Link>
        </div>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 truncate">{user?.name || user?.email}</p>
              <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-gray-900/50 border-b border-white/5 sticky top-0 z-20 backdrop-blur-lg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 hover:bg-white/10 rounded-md text-white/60"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold text-white truncate">{appName}</h1>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
