"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

interface OAuthUser {
  id: string;
  email: string;
  name?: string;
}

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthSession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");
  const encodedUser = searchParams.get("user");
  const serverError = searchParams.get("error");

  const parsedUser = useMemo(() => {
    if (!encodedUser) return null;
    try {
      return JSON.parse(encodedUser) as OAuthUser;
    } catch {
      return null;
    }
  }, [encodedUser]);

  useEffect(() => {
    let cancelled = false;

    const completeAuth = async () => {
      if (serverError) {
        setError(serverError);
        return;
      }

      if (!token) {
        setError("Authentication failed: missing token");
        return;
      }

      try {
        if (parsedUser?.id && parsedUser?.email) {
          if (!cancelled) {
            setAuthSession(token, parsedUser);
            router.replace("/dashboard");
          }
          return;
        }

        const me = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!me.data?.success || !me.data?.data) {
          throw new Error("Unable to fetch user profile");
        }

        const user = me.data.data as OAuthUser;
        if (!cancelled) {
          setAuthSession(token, user);
          router.replace("/dashboard");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.error || err?.message || "Authentication failed");
        }
      }
    };

    completeAuth();

    return () => {
      cancelled = true;
    };
  }, [token, parsedUser, serverError, setAuthSession, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        {error ? (
          <>
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
            <h1 className="text-lg font-semibold text-white mb-2">Sign in failed</h1>
            <p className="text-sm text-white/60 mb-4">{error}</p>
            <button
              onClick={() => router.replace("/login")}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-indigo-400" />
            <h1 className="text-lg font-semibold text-white mb-2">Completing sign in</h1>
            <p className="text-sm text-white/60">Please wait while we set up your session.</p>
          </>
        )}
      </div>
    </div>
  );
}
