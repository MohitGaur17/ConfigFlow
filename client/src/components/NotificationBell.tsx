"use client";

import React from "react";
import { Bell } from "lucide-react";
import { useNotificationCenter } from "@/lib/notification-context";

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = "" }: NotificationBellProps) {
  const { unreadCount, toggleOpen, isOpen, isConnected } = useNotificationCenter();

  return (
    <button
      type="button"
      onClick={toggleOpen}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border border-white/10 bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-900 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
        isOpen ? "border-indigo-500/50 bg-indigo-500/10 text-white" : ""
      } ${className}`}
      aria-label="Notifications"
      title="Notifications"
    >
      <Bell className="w-4 h-4" />

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(255,107,0,0.6)] animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}

      {/* Real-time live connected status dot */}
      {isConnected && unreadCount === 0 && (
        <span
          className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
          title="Live feed connected"
        />
      )}
    </button>
  );
}
