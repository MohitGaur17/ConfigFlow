"use client";

import { X, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationSidebarProps {
  notifications: NotificationRecord[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (notificationId: string) => void;
  onMarkAllRead?: () => void;
  isLoading?: boolean;
}

export default function NotificationSidebar({
  notifications,
  isOpen,
  onClose,
  onMarkRead,
  onMarkAllRead,
  isLoading = false,
}: NotificationSidebarProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-white/10 shadow-xl transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-4 md:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            <p className="text-xs text-white/40 mt-1">
              {notifications.length} message{notifications.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onMarkAllRead && (
              <button
                onClick={onMarkAllRead}
                className="text-xs md:text-sm inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/90 font-medium transition-colors mr-2"
                title="Mark all as Read"
              >
                Mark all as Read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4 md:p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 rounded-xl border border-white/10 bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4 md:p-6">
              <div className="text-center">
                <p className="text-sm text-white/50">No notifications yet</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4 md:p-6">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border p-4 transition-all ${
                    notification.isRead
                      ? "border-white/8 bg-black/10"
                      : "border-indigo-500/30 bg-indigo-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
                        {notification.type} · {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => onMarkRead(notification.id)}
                        className="flex-shrink-0 inline-flex items-center justify-center p-1.5 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors"
                        title="Mark as read"
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
