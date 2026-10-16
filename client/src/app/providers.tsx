"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth-context";
import { ConfigProvider } from "@/lib/config-context";
import { NotificationProvider } from "@/lib/notification-context";
import NotificationSidebar from "@/components/NotificationSidebar";
import PwaRegister from "@/components/PwaRegister";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ConfigProvider>
          {children}
          <NotificationSidebar />
          <PwaRegister />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#11141A",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              },
            }}
          />
        </ConfigProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
