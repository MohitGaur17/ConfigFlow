"use client";

import React, { useEffect } from "react";
import { X, CheckCircle2, Radio, Bell } from "lucide-react";
import { useNotificationCenter, NotificationRecord } from "@/lib/notification-context";

interface NotificationSidebarProps {
  notifications?: NotificationRecord[];
  isOpen?: boolean;
  onClose?: () => void;
  onMarkRead?: (notificationId: string) => void;
  onMarkAllRead?: () => void;
  isLoading?: boolean;
}

export default function NotificationSidebar(props: NotificationSidebarProps) {
  const context = useNotificationCenter();

  const notifications = props.notifications ?? context.notifications;
  const isOpen = props.isOpen !== undefined ? props.isOpen : context.isOpen;
  const onClose = props.onClose ?? (() => context.setIsOpen(false));
  const onMarkRead = props.onMarkRead ?? context.markAsRead;
  const onMarkAllRead = props.onMarkAllRead ?? context.markAllAsRead;
  const isLoading = props.isLoading !== undefined ? props.isLoading : context.isLoading;
  const isConnected = context.isConnected;

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out z-50 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-4 md:p-6 flex items-center justify-between bg-surface-container/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Notifications</h2>
              {isConnected && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  title="Live feed connected"
                >
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  <span>Live</span>
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 mt-1">
              {notifications.length} {notifications.length === 1 ? "message" : "messages"}
              {unreadCount > 0 && ` · ${unreadCount} unread`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && onMarkAllRead && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/90 font-medium transition-colors border border-white/10"
                title="Mark all as Read"
              >
                Mark all as Read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
              aria-label="Close notifications drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4 md:p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 rounded-xl border border-white/10 bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-white/60">No notifications yet</p>
              <p className="text-xs text-white/40 mt-1 max-w-[220px]">
                Events and system updates will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-4 md:p-6">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border p-4 transition-all ${
                    notification.isRead
                      ? "border-white/5 bg-white/[0.02]"
                      : "border-indigo-500/30 bg-indigo-500/10 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-white/70 whitespace-pre-wrap leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
                        {notification.type} ·{" "}
                        {new Date(notification.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => onMarkRead(notification.id)}
                        className="flex-shrink-0 inline-flex items-center justify-center p-1.5 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/20 transition-colors"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
