"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resetToken = new URLSearchParams(window.location.search).get("token");
    setToken(resetToken);
    setTokenLoaded(true);
  }, []);

  useEffect(() => {
    if (!success) return;
    const redirectTimer = window.setTimeout(() => router.replace("/login"), 2200);
    return () => window.clearTimeout(redirectTimer);
  }, [success, router]);

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("This password reset link is invalid or expired. Request a new one.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      logout();
      setSuccess(true);
    } catch (resetError) {
      const apiError = resetError as { response?: { data?: { error?: string } }; message?: string };
      setError(apiError.response?.data?.error || apiError.message || "Unable to reset your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card relative w-full overflow-hidden rounded-xl border border-outline-hairline p-5 shadow-2xl sm:p-8">
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-50" />

      {success ? (
        <div className="py-3 text-center" role="status" aria-live="polite">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-emerald-400/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="mb-3 font-headline-lg text-2xl text-on-surface">Password reset successful</h1>
          <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
            Your new password is ready. Sending you to log in…
          </p>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="w-full rounded bg-primary-container px-4 py-3 font-label-tech text-label-tech text-white transition-colors hover:bg-orange-600"
          >
            Continue to login
          </button>
        </div>
      ) : !tokenLoaded ? (
        <div className="py-8 text-center text-on-surface-variant" role="status" aria-live="polite">
          <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-primary" />
          <p className="font-body-md text-body-md">Loading reset link…</p>
        </div>
      ) : !token ? (
        <div className="py-3 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-error/20">
            <AlertCircle className="h-8 w-8 text-error" />
          </div>
          <h1 className="mb-3 font-headline-lg text-2xl text-on-surface">Reset link unavailable</h1>
          <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
            This password reset link is missing, invalid, or expired. Request a new link to continue.
          </p>
          <Link href="/forgot-password" className="inline-flex w-full items-center justify-center rounded bg-primary-container px-4 py-3 font-label-tech text-label-tech text-white transition-colors hover:bg-orange-600">
            Request a new link
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-primary/20">
              <LockKeyhole className="h-7 w-7 text-primary" />
            </div>
            <h1 className="mb-2 font-headline-lg text-2xl text-on-surface">Create a new password</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Choose a new password for your ConfigFlow account.</p>
          </div>

          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-password" className="ml-1 font-label-tech text-label-tech text-on-surface-variant">NEW PASSWORD</label>
              <input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded border border-outline-hairline bg-surface-container/50 px-4 py-3 font-code-base text-code-base text-on-surface outline-none transition-shadow focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="ml-1 font-label-tech text-label-tech text-on-surface-variant">CONFIRM NEW PASSWORD</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your new password"
                className="w-full rounded border border-outline-hairline bg-surface-container/50 px-4 py-3 font-code-base text-code-base text-on-surface outline-none transition-shadow focus:ring-1 focus:ring-primary"
              />
            </div>
            {error && <p className="text-sm text-error" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-primary-container px-4 py-3 font-label-tech text-label-tech text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Resetting password…" : "Reset password"}
            </button>
            <p className="text-center font-body-md text-sm text-on-surface-variant">
              Reset link expired? <Link href="/forgot-password" className="text-primary transition-colors hover:text-primary-fixed">Request another.</Link>
            </p>
          </form>
        </>
      )}
    </div>
  );
}
