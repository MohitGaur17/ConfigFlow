"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { AlertCircle, Loader2, Mail } from "lucide-react";

interface VerificationState {
  email: string;
  emailSent: boolean;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<"sent" | "error" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormError(null);
    setIsLoading(true);
    try {
      const result = await register(email, password, name);
      setVerification({ email, emailSent: result.verificationEmailSent === true });
      setResendStatus(null);
    } catch (error) {
      const registrationError = error as {
        message?: string;
        response?: { status?: number; data?: { error?: string } };
      };
      const message = registrationError.response?.data?.error || registrationError.message || "Failed to create account.";

      if (registrationError.response?.status === 409 && message.toLowerCase().includes("verify")) {
        setVerification({ email, emailSent: false });
        setResendStatus(null);
      } else {
        setFormError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!verification) return;
    setResendLoading(true);
    setResendStatus(null);

    try {
      const response = await api.post("/auth/resend-verification", { email: verification.email });
      const emailSent = response.data?.data?.verificationEmailSent === true;
      setVerification({ ...verification, emailSent });
      setResendStatus(emailSent ? "sent" : "error");
    } catch {
      setResendStatus("error");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <div className="glass-card relative flex w-full flex-col overflow-hidden rounded-xl border border-outline-hairline p-5 shadow-2xl sm:p-8">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-50" />

        <div className="mb-8 text-center">
          <h1 className="mb-2 font-headline-lg text-headline-lg text-on-surface">Start generating software.</h1>
          <p className="font-label-tech text-label-tech text-on-surface-variant">
            {verification ? "One more step to create your workspace." : "Create your workspace to begin."}
          </p>
        </div>

        {verification ? (
          <div className="text-center" aria-live="polite">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-primary/20">
              {verification.emailSent ? <Mail className="h-8 w-8 text-primary" /> : <AlertCircle className="h-8 w-8 text-primary" />}
            </div>
            <h2 className="mb-3 font-headline-md text-xl text-on-surface">
              {verification.emailSent ? "Check your email" : "Verification email not sent yet"}
            </h2>
            <p className="mb-2 font-code-base text-sm leading-relaxed text-on-surface-variant">
              {verification.emailSent
                ? "We sent a verification link to:"
                : "Your account is ready, but we couldn't confirm a verification email was sent to:"}
            </p>
            <p className="mb-4 break-all font-code-base text-sm font-bold text-on-surface">{verification.email}</p>
            <p className="mb-6 font-code-base text-sm leading-relaxed text-on-surface-variant">
              {verification.emailSent
                ? "Open the link in that email to verify your account. After verification, sign in with this email and your password."
                : "Request a new link below. When it arrives, open it to verify your account, then sign in with this email and your password."}
            </p>

            {resendStatus === "sent" && (
              <p className="mb-4 font-code-base text-sm text-emerald-400" role="status">
                A new verification link was sent to {verification.email}.
              </p>
            )}
            {resendStatus === "error" && (
              <p className="mb-4 font-code-base text-sm text-error" role="alert">
                We couldn't send a verification link. Please try again in a moment.
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={resendVerification}
                disabled={resendLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded border border-outline-hairline bg-surface-container-high px-4 py-3 font-label-tech text-label-tech text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {resendLoading ? "Sending…" : "Resend verification link"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleRegister} className="mb-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="full-name" className="ml-1 font-label-tech text-label-tech text-on-surface-variant">FULL NAME</label>
                <input id="full-name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="input-field w-full border-0 border-b border-outline-variant bg-transparent px-0 py-3 font-code-base text-code-base text-on-surface transition-colors placeholder-on-surface-variant focus:border-primary focus:ring-0" placeholder="Jane Doe" required type="text" maxLength={100} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="register-email" className="ml-1 font-label-tech text-label-tech text-on-surface-variant">EMAIL</label>
                <input id="register-email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input-field w-full border-0 border-b border-outline-variant bg-transparent px-0 py-3 font-code-base text-code-base text-on-surface transition-colors placeholder-on-surface-variant focus:border-primary focus:ring-0" placeholder="work@company.com" required type="email" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="register-password" className="ml-1 font-label-tech text-label-tech text-on-surface-variant">PASSWORD</label>
                <input id="register-password" name="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="input-field w-full border-0 border-b border-outline-variant bg-transparent px-0 py-3 font-code-base text-code-base text-on-surface transition-colors placeholder-on-surface-variant focus:border-primary focus:ring-0" placeholder="At least 8 characters" required type="password" minLength={8} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm-password" className="ml-1 font-label-tech text-label-tech text-on-surface-variant">CONFIRM PASSWORD</label>
                <input id="confirm-password" name="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input-field w-full border-0 border-b border-outline-variant bg-transparent px-0 py-3 font-code-base text-code-base text-on-surface transition-colors placeholder-on-surface-variant focus:border-primary focus:ring-0" placeholder="Re-enter your password" required type="password" minLength={8} />
              </div>
              {formError && <p className="text-sm text-error" role="alert">{formError}</p>}
              <div className="pt-4">
                <button type="submit" disabled={isLoading} className="glow-button w-full rounded bg-primary-container px-4 py-3 font-headline-md text-[16px] font-bold tracking-wide text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
                  {isLoading ? "Creating account…" : "Sign up"}
                </button>
              </div>
            </form>

            <div className="text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Already have an account? <Link className="text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary-fixed" href="/login">Log in.</Link>
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-on-surface-variant opacity-70">
        <span className="material-symbols-outlined text-[16px]">lock</span>
        <span className="font-label-tech text-label-tech">Secure 256-bit encryption. We never share your data.</span>
      </div>
    </>
  );
}
