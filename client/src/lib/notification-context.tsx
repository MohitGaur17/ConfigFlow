"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./auth-context";
import api from "./api";
import toast from "react-hot-toast";
import { Bell } from "lucide-react";

export interface NotificationRecord {
  id: string;
  userId: string;
  appId?: string | null;
  entityName?: string | null;
  type: "auth" | "app" | "entity" | "system";
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

interface NotificationContextType {
  notifications: NotificationRecord[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  isLoading: boolean;
  isConnected: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const res = await api.get("/notifications");
      if (res.data?.success && Array.isArray(res.data.data?.notifications)) {
        setNotifications(res.data.data.notifications);
      }
    } catch (error) {
      console.error("[Notifications] Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error("[Notifications] Failed to mark read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      await api.post("/notifications/read-all");
    } catch (error) {
      console.error("[Notifications] Failed to mark all read:", error);
    }
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    if (!isAuthenticated || !token || typeof window === "undefined") {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
      setNotifications([]);
      return;
    }

    // Initial fetch of notifications
    refresh();

    const streamUrl = `${API_BASE}/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.addEventListener("notification", (e: MessageEvent) => {
      try {
        const item: NotificationRecord = JSON.parse(e.data);
        setNotifications((prev) => [item, ...prev.filter((n) => n.id !== item.id)]);

        // Display instant floating notification toast
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-in fade-in slide-in-from-top-2" : "animate-out fade-out"
              } max-w-sm w-full bg-slate-900/95 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.25)] rounded-xl pointer-events-auto p-4 backdrop-blur-md cursor-pointer`}
              onClick={() => {
                toast.dismiss(t.id);
                setIsOpen(true);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                  <p className="text-xs text-white/70 mt-0.5 line-clamp-2">{item.message}</p>
                  <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">
                    {item.type} · Just now
                  </p>
                </div>
              </div>
            </div>
          ),
          { duration: 4000, position: "top-right" }
        );
      } catch (err) {
        console.error("[Notifications] SSE parse error:", err);
      }
    });

    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token, refresh]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        setIsOpen,
        toggleOpen,
        isLoading,
        isConnected,
        markAsRead,
        markAllAsRead,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationCenter() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationCenter must be used within NotificationProvider");
  }
  return context;
}
