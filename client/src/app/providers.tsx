"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ConfigProvider } from "@/lib/config-context";
import { LanguageProvider } from "@/i18n/LanguageContext";

import LanguageSyncComponent from "@/components/LanguageSyncComponent";
import { Toaster } from "react-hot-toast";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ConfigProvider>
          {children}
          <LanguageSyncComponent />
          <Toaster position="top-right" />
        </ConfigProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
