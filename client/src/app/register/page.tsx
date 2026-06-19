"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Blocks, Loader2, AlertCircle, CheckCircle2, Mail, ArrowLeft } from "lucide-react";

import { useTranslation } from "@/i18n/useTranslation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function GoogleLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.6 2.8-3.9 2.8-6.7 0-.7-.1-1.4-.2-2H12z" />
      <path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.4-2.4l-3-2.3c-.8.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2H3.3v2.6C4.9 19.8 8.2 22 12 22z" />
      <path fill="#4A90E2" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.3A10 10 0 002 12c0 1.7.4 3.4 1.3 4.6L6.4 14z" />
      <path fill="#FBBC05" d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.8 2.8 14.6 2 12 2 8.2 2 4.9 4.2 3.3 7.4L6.4 10c.8-2.4 3-4.2 5.6-4.2z" />
    </svg>
  );
}

function GitHubLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5C5.6.5.5 5.7.5 12.1c0 5.1 3.3 9.5 7.9 11.1.6.1.8-.2.8-.6v-2.2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.5-.3-5.2-1.3-5.2-5.8 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2.8.9 1.2 2 1.2 3.3 0 4.6-2.7 5.5-5.2 5.8.4.3.8 1 .8 2v3c0 .4.2.7.8.6a11.6 11.6 0 007.9-11.1C23.5 5.7 18.4.5 12 .5z"
      />
    </svg>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  // Prefer structured server response (axios-like)
  if (typeof error === "object" && error !== null) {
    const maybe = error as {
      response?: { status?: number; data?: { error?: string } };
      message?: string;
    };

    const serverError = maybe.response?.data?.error;
    const status = maybe.response?.status;

    if (status === 409) {
      // Conflict — common case: email already exists / needs verification
      if (serverError && /verify/i.test(serverError)) {
        return "An account with that email already exists. Check your inbox for the verification link or click 'Resend verification' to request a new one.";
      }

      if (serverError && /already registered/i.test(serverError)) {
        return "This email is already registered. Try signing in or request a verification link if you haven't verified your address.";
      }

      return serverError || "This email is already in use. Try signing in or request a new verification link.";
    }

    if (serverError) return serverError;
    if (maybe.message) return maybe.message;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationDeliveryProblem, setVerificationDeliveryProblem] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  const { t } = useTranslation();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const startOAuth = async (provider: "google" | "github") => {
    setError(null);
    setOauthLoading(provider);

    try {
      const res = await fetch(`${API_BASE}/api/auth/${provider}/start?mode=json`);
      const data = await res.json();

      if (!res.ok || !data?.success || !data?.data?.url) {
        throw new Error(data?.error || `${provider} sign in is not configured`);
      }

      window.location.href = data.data.url as string;
    } catch (error: unknown) {
      setError(getErrorMessage(error, `${provider} sign in failed`));
      setOauthLoading(null);
    }
  };

  useEffect(() => {
    const resetOAuthLoading = () => setOauthLoading(null);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetOAuthLoading();
      }
    };

    // If user returns from provider page (back/cancel), unlock OAuth buttons.
    window.addEventListener("focus", resetOAuthLoading);
    window.addEventListener("pageshow", resetOAuthLoading);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", resetOAuthLoading);
      window.removeEventListener("pageshow", resetOAuthLoading);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setVerificationSent(false);
    setVerificationDeliveryProblem(false);

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      const result = await register(email, password, name || undefined);
      setVerificationSent(true);
      setVerificationDeliveryProblem(result.verificationEmailSent === false);
      setPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setError(null);
    setResendLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to resend verification email");
      }

      // Show the verification panel so the user has clear next steps
      setVerificationSent(true);
      // If the server indicates delivery failed, surface that state
      setVerificationDeliveryProblem(data?.data?.verificationEmailSent === false);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Unable to resend verification email"));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 sm:px-6 safe-area-inset-top safe-area-inset-bottom">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Blocks className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">{t('auth.signup')}</h1>
          <p className="text-white/40 text-xs md:text-sm mt-1">{t('header.tagline')}</p>
          <div className="mt-4 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>

        {verificationSent ? (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/12 via-emerald-500/8 to-white/5 p-6 md:p-7 text-center shadow-2xl shadow-emerald-950/10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/20">
              <CheckCircle2 className="h-7 w-7 text-emerald-300" />
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-white">Check your inbox</h2>

            <p className="mt-3 text-sm leading-6 text-white/70">
              We sent a verification link to
              <span className="mx-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 font-medium text-white">
                <Mail className="h-3.5 w-3.5 text-emerald-300" />
                {email}
              </span>
              Open it to finish creating your account and sign in automatically.
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/65">
              Didn’t receive it? Check spam or resend a fresh verification link below.
            </div>

            {verificationDeliveryProblem && (
              <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                The email could not be delivered automatically. Use resend to try again.
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={resendVerification}
                disabled={resendLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                {resendLoading ? "Sending..." : "Resend email"}
              </button>

              <button
                type="button"
                onClick={() => setVerificationSent(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Change email
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-4 inline-flex items-center justify-center text-sm font-medium text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Back to login
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs md:text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {email && error && /already|verify|verification|resend/i.test(error) && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={resendVerification}
                disabled={resendLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                {resendLoading ? "Sending..." : "Resend verification"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Back to login
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-medium text-white/60 mb-1 md:mb-1.5">{t('auth.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm md:text-base"
              placeholder={t('auth.fullName')}
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-white/60 mb-1 md:mb-1.5">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm md:text-base"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-white/60 mb-1 md:mb-1.5">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm md:text-base"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-white/60 mb-1 md:mb-1.5">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm md:text-base"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 md:py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 text-sm md:text-base active:scale-95"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('auth.signup')}
          </button>
        </form>
        )}

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">{t("auth.orContinueWith", "Or continue with")}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!!oauthLoading}
            onClick={() => startOAuth("google")}
            className="w-full py-2 md:py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
          >
            {oauthLoading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleLogo className="w-4 h-4" />}
            {t("auth.continueWithGoogle", "Google")}
          </button>

          <button
            type="button"
            disabled={!!oauthLoading}
            onClick={() => startOAuth("github")}
            className="w-full py-2 md:py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
          >
            {oauthLoading === "github" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitHubLogo className="w-4 h-4" />}
            {t("auth.continueWithGithub", "GitHub")}
          </button>
        </div>

        <p className="text-center text-xs md:text-sm text-white/40 mt-6 md:mt-8">
          {t('auth.haveAccount')}{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
