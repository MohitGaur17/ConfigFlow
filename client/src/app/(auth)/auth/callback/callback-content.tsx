"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Mail, Clock, ShieldX, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

interface OAuthUser {
  id: string;
  email: string;
  name?: string;
}

type VerifyError = "expired" | "used" | "invalid" | null;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ─── Verification-error recovery panel ────────────────────────────────────────
function VerifyErrorPanel({ kind, email }: { kind: VerifyError; email: string | null }) {
  const router = useRouter();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const resend = async () => {
    if (!email) return;
    setResendLoading(true);
    setResendError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Unable to resend");
      setResendSuccess(true);
    } catch (err: any) {
      setResendError(err?.message || "Unable to resend verification email");
    } finally {
      setResendLoading(false);
    }
  };

  const config = {
    expired: {
      icon: <Clock className="h-8 w-8 text-amber-400" />,
      iconBg: "bg-surface-elevated ring-amber-400/20",
      title: "Link expired",
      desc: "This verification link has expired. Links are valid for 30 minutes.",
      canResend: true,
    },
    used: {
      icon: <ShieldX className="h-8 w-8 text-primary" />,
      iconBg: "bg-surface-elevated ring-primary/20",
      title: "Link already used",
      desc: "This verification link has already been used. If you're still having trouble signing in, request a new one.",
      canResend: true,
    },
    invalid: {
      icon: <AlertCircle className="h-8 w-8 text-error" />,
      iconBg: "bg-surface-elevated ring-error/20",
      title: "Invalid link",
      desc: "This verification link is not valid. It may have been copied incorrectly.",
      canResend: false,
    },
  }[kind ?? "invalid"];

  if (resendSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded bg-surface-elevated ring-1 ring-emerald-400/20">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-xl font-headline-md text-on-surface mb-2">Verification email sent</h1>
        <p className="text-sm font-code-base text-on-surface-variant mb-6">
          We sent a new link to{" "}
          <span className="font-bold text-on-surface">{email}</span>.{" "}
          Check your inbox and click the link to verify your account.
        </p>
        <button
          onClick={() => router.replace("/login")}
          className="inline-flex items-center justify-center rounded bg-primary-container px-5 py-2.5 text-sm font-label-tech text-white hover:bg-orange-600 transition-colors shadow-[0_0_10px_rgba(255,107,0,0.3)]"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Icon */}
      <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded ring-1 ${config.iconBg}`}>
        {config.icon}
      </div>

      <h1 className="text-xl font-headline-md text-on-surface mb-2">{config.title}</h1>
      <p className="text-sm font-code-base text-on-surface-variant mb-6 leading-relaxed">{config.desc}</p>

      {resendError && (
        <div className="mb-4 flex items-center gap-2 rounded border border-error/20 bg-error/10 px-4 py-3 text-sm font-code-base text-error">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {resendError}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {config.canResend && email && (
          <button
            onClick={resend}
            disabled={resendLoading}
            className="inline-flex items-center justify-center gap-2 rounded bg-surface-elevated px-5 py-3 text-sm font-label-tech text-on-surface transition-colors hover:bg-surface-variant border border-outline-hairline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {resendLoading ? "Sending…" : "Send a new verification link"}
          </button>
        )}

        <button
          onClick={() => router.replace("/register")}
          className="inline-flex items-center justify-center rounded border border-outline-hairline bg-surface-container px-5 py-3 text-sm font-label-tech text-on-surface transition-colors hover:bg-surface-variant"
        >
          Back to sign up
        </button>

        <button
          onClick={() => router.replace("/login")}
          className="text-sm font-label-tech text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Already verified? Sign in
        </button>
      </div>
    </div>
  );
}

// ─── Generic OAuth / auth error panel ─────────────────────────────────────────
function GenericErrorPanel({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div className="text-center">
      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-error" />
      <h1 className="text-lg font-headline-md text-on-surface mb-2">Sign in failed</h1>
      <p className="text-sm font-code-base text-on-surface-variant mb-6">{message}</p>
      <button
        onClick={() => router.replace("/login")}
        className="inline-flex items-center justify-center rounded bg-primary-container px-5 py-2.5 text-sm font-label-tech text-white hover:bg-orange-600 transition-colors shadow-[0_0_10px_rgba(255,107,0,0.3)]"
      >
        Back to login
      </button>
    </div>
  );
}

// ─── Main callback component ───────────────────────────────────────────────────
export default function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthSession } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const token = searchParams.get("token");
  const encodedUser = searchParams.get("user");
  const serverError = searchParams.get("error");

  // Verification-specific error params
  const verifyError = searchParams.get("verifyError") as VerifyError;
  const verifyEmail = searchParams.get("email");

  const parsedUser = useMemo(() => {
    if (!encodedUser) return null;
    try {
      return JSON.parse(encodedUser) as OAuthUser;
    } catch {
      return null;
    }
  }, [encodedUser]);

  useEffect(() => {
    // If this is a verification error redirect, don't attempt auth
    if (verifyError) return;

    let cancelled = false;

    const completeAuth = async () => {
      if (serverError) {
        setAuthError(serverError);
        return;
      }

      if (!token) {
        setAuthError("Authentication failed: missing token");
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
          setAuthError(err?.response?.data?.error || err?.message || "Authentication failed");
        }
      }
    };

    completeAuth();

    return () => {
      cancelled = true;
    };
  }, [token, parsedUser, serverError, verifyError, setAuthSession, router]);

  // ── Verification error states ──
  if (verifyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6">
        <div className="w-full max-w-sm rounded border border-outline-hairline bg-surface-elevated p-8 shadow-2xl">
          <VerifyErrorPanel kind={verifyError} email={verifyEmail} />
        </div>
      </div>
    );
  }

  // ── Generic error ──
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6">
        <div className="w-full max-w-md rounded border border-outline-hairline bg-surface-elevated p-6">
          <GenericErrorPanel message={authError} />
        </div>
      </div>
    );
  }

  // ── Loading / completing auth ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="w-full max-w-md rounded border border-outline-hairline bg-surface-elevated p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
        <p className="text-sm font-code-base text-on-surface-variant">Completing sign in…</p>
      </div>
    </div>
  );
}
