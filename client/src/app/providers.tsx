"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ConfigProvider } from "@/lib/config-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConfigProvider>
        {children}
      </ConfigProvider>
    </AuthProvider>
  );
}
