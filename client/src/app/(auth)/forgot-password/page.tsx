"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import api from "@/lib/api";

interface ForgotPasswordResponse {
  registered: boolean;
  resetEmailSent: boolean;
  emailVerified: boolean;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);

  const requestResetLink = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const isResend = submitted;
    setLoading(true);
    setError(null);
    setResent(false);

    try {
      const response = await api.post("/auth/forgot-password", { email });
      const data = response.data?.data;
      const requestResult: ForgotPasswordResponse = {
        registered: data?.registered === true,
        resetEmailSent: data?.resetEmailSent === true,
        emailVerified: data?.emailVerified === true,
      };
      setResult(requestResult);
      setSubmitted(true);
      setResent(isResend && requestResult.resetEmailSent);
    } catch (requestError) {
      const apiError = requestError as { response?: { data?: { error?: string } }; message?: string };
      setError(apiError.response?.data?.error || apiError.message || "Unable to request a reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const useDifferentEmail = () => {
    setSubmitted(false);
    setResult(null);
    setError(null);
    setResent(false);
  };

  return (
    <div className="glass-card relative w-full overflow-hidden rounded-xl border border-outline-hairline p-5 shadow-2xl sm:p-8">
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-50" />

      {submitted && result ? (
        <div className="text-center" aria-live="polite">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-primary/20">
            {result.registered && result.resetEmailSent ? <Mail className="h-8 w-8 text-primary" /> : <AlertCircle className="h-8 w-8 text-primary" />}
          </div>
          <h1 className="mb-3 font-headline-lg text-2xl text-on-surface">
            {!result.registered ? "No account found" : result.resetEmailSent ? "Check your email" : "Reset link not sent"}
          </h1>
          <p className="mb-2 font-code-base text-sm leading-relaxed text-on-surface-variant">
            {!result.registered
              ? "There is no account registered with this email:"
              : result.resetEmailSent
                ? "A password reset link was sent to:"
                : "We couldn't send a password reset link to:"}
          </p>
          <p className="mb-4 break-all font-code-base text-sm font-bold text-on-surface">{email}</p>

          {!result.registered ? (
            <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
              Sign up to create an account, or try a different email address.
            </p>
          ) : result.resetEmailSent ? (
            <>
              <p className="mb-4 font-code-base text-sm leading-relaxed text-on-surface-variant">
                Open the link in that email to choose a new password. The link expires in 30 minutes.
              </p>
              {!result.emailVerified && (
                <p className="mb-6 font-code-base text-sm leading-relaxed text-amber-400">
                  After resetting your password, verify your email before signing in.
                </p>
              )}
            </>
          ) : (
            <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
              You can try sending the reset link again in a moment.
            </p>
          )}

          {resent && <p className="mb-4 text-sm font-code-base text-emerald-400" role="status">A new reset link was sent to {email}.</p>}
          {error && <p className="mb-4 text-sm text-error" role="alert">{error}</p>}

          <div className="flex flex-col gap-3">
            {result.registered ? (
              <button
                type="button"
                onClick={() => requestResetLink()}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded border border-outline-hairline bg-surface-container-high px-4 py-3 font-label-tech text-label-tech text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Sending…" : "Resend reset link"}
              </button>
            ) : (
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center rounded bg-primary-container px-4 py-3 font-label-tech text-label-tech text-white transition-colors hover:bg-orange-600"
              >
                Sign up
              </Link>
            )}
            <button
              type="button"
              onClick={useDifferentEmail}
              className="font-label-tech text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Use a different email
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-primary/20">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h1 className="mb-2 font-headline-lg text-2xl text-on-surface">Forgot your password?</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Enter your account email to receive a password reset link.
            </p>
          </div>

          <form onSubmit={requestResetLink} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reset-email" className="ml-1 font-label-tech text-label-tech text-on-surface-variant">EMAIL ADDRESS</label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
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
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center font-body-md text-body-md text-on-surface-variant">
            Remembered your password? <Link className="text-primary transition-colors hover:text-primary-fixed" href="/login">Log in.</Link>
          </p>
        </>
      )}
    </div>
  );
}
