"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useConfig } from "@/lib/config-context";
import api from "@/lib/api";
import { AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

interface ProviderAvailability {
  enabled: boolean;
  google: boolean;
  github: boolean;
}

function GitHubLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5C5.6.5.5 5.7.5 12.1c0 5.1 3.3 9.5 7.9 11.1.6.1.8-.2.8-.6v-2.2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.5-.3-5.2-1.3-5.2-5.8 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2.8.9 1.2 2 1.2 3.3 0 4.6-2.7 5.5-5.2 5.8.4.3.8 1 .8 2v3c0 .4.2.7.8.6a11.6 11.6 0 007.9-11.1C23.5 5.7 18.4.5 12 .5z"
      />
    </svg>
  );
}

function GoogleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.6 2.8-3.9 2.8-6.7 0-.7-.1-1.4-.2-2H12z" />
      <path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.4-2.4l-3-2.3c-.8.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2H3.3v2.6C4.9 19.8 8.2 22 12 22z" />
      <path fill="#4A90E2" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.3A10 10 0 002 12c0 1.7.4 3.4 1.3 4.6L6.4 14z" />
      <path fill="#FBBC05" d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.8 2.8 14.6 2 12 2 8.2 2 4.9 4.2 3.3 7.4L6.4 10c.8-2.4 3-4.2 5.6-4.2z" />
    </svg>
  );
}

export default function GeneratedAppAuthPreviewPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { config, loading } = useConfig();
  const [availability, setAvailability] = useState<ProviderAvailability | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    let mounted = true;

    const loadAvailability = async () => {
      try {
        const response = await api.get(`/apps/${appId}/auth/providers`);
        const data = response.data;

        if (!mounted) {
          return;
        }

        if (data?.success) {
          setAvailability(data.data as ProviderAvailability);
        } else {
          setAvailability({ enabled: false, google: false, github: false });
        }
      } catch {
        if (mounted) {
          setAvailability({ enabled: false, google: false, github: false });
        }
      }
    };

    loadAvailability();

    return () => {
      mounted = false;
    };
  }, [appId]);

  const effectiveAvailability = useMemo(() => {
    const authConfig = config?.app.auth;
    const enabled = Boolean(authConfig?.enabled && availability?.enabled);

    return {
      enabled,
      google: enabled && Boolean(authConfig?.providers?.google !== false && availability?.google),
      github: enabled && Boolean(authConfig?.providers?.github !== false && availability?.github),
    };
  }, [availability, config]);

  if (loading || !config) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-white/10 bg-white/5">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!effectiveAvailability.enabled) {
    const authEnabled = Boolean(config.app.auth?.enabled);

    return (
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20 backdrop-blur-xl">
        <ShieldCheck className="mx-auto h-12 w-12 text-emerald-400" />
        <h1 className="mt-4 text-3xl font-bold text-white">
          {authEnabled ? "Authentication is enabled, but no providers are active" : "Authentication is disabled for this app"}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/60">
          {authEnabled
            ? "Turn on at least one OAuth provider in the app config and set the matching server environment variables to reveal the auth buttons."
            : "The generated app respects the app config, so the auth entrypoint disappears when auth is turned off."}
        </p>
        <div className="mt-8">
          <Link href={`/builder/${appId}`} className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400">
            Back to preview
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const showRegister = mode === "register";

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.2),_transparent_32%)]" />
        <div className="relative">
          <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight sm:text-5xl">{config.app.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{config.app.description || "Welcome to your generated app."}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">{showRegister ? "Create your account" : "Sign in to continue"}</h2>
        </div>

        <div className="mt-6 flex rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "login" ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "register" ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
          >
            Register
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email</span>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-400" placeholder="you@example.com" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Password</span>
            <input type="password" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-400" placeholder="••••••••" />
          </label>

          {showRegister && (
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Name</span>
              <input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-400" placeholder="Your name" />
            </label>
          )}

          <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-400">
            {showRegister ? "Create account" : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {effectiveAvailability.google || effectiveAvailability.github ? (
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Or continue with</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="mt-4 grid gap-3">
              {effectiveAvailability.google && (
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  <GoogleLogo className="h-4 w-4" />
                  Continue with Google
                </button>
              )}
              {effectiveAvailability.github && (
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  <GitHubLogo className="h-4 w-4" />
                  Continue with GitHub
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>OAuth buttons are hidden until the app config and environment both enable a provider.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
