"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ConfigProvider } from "@/lib/config-context";
import { LanguageProvider } from "@/i18n/LanguageContext";

import LanguageSyncComponent from "@/components/LanguageSyncComponent";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ConfigProvider>
          {children}
          <LanguageSyncComponent />
        </ConfigProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
