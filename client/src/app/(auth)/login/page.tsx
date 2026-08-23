"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  
  const { login } = useAuth();
  
  // State for our form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // The function that talks to your Express backend
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      
      toast.success("Welcome back!");
      router.push("/dashboard"); // Send them to the IDE!
      
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google/start`;
  };

  const handleGithubLogin = () => {
    window.location.href = `${API_BASE}/api/auth/github/start`;
  };

  return (
    <>
      <div className="glass-panel rounded-xl w-full border border-outline-hairline p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Welcome back.</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Sign in to continue to your workspace.</p>
        </div>

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-3">
          <button onClick={handleGithubLogin} type="button" className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded border border-outline-hairline bg-surface-container-high hover:bg-surface-variant transition-colors text-on-surface font-label-tech text-label-tech">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg>
            Continue with GitHub
          </button>
          <button onClick={handleGoogleLogin} type="button" className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded border border-outline-hairline bg-surface-container-high hover:bg-surface-variant transition-colors text-on-surface font-label-tech text-label-tech">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-outline-hairline"></div>
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-outline-hairline"></div>
        </div>

        {/* The Wired-Up Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-tech text-label-tech text-on-surface-variant ml-1">EMAIL ADDRESS</label>
            <input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container/50 border border-outline-hairline rounded px-4 py-2 text-on-surface font-code-base text-code-base input-glow outline-none transition-shadow" 
              placeholder="name@company.com" 
              required 
              type="email" 
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="font-label-tech text-label-tech text-on-surface-variant ml-1">PASSWORD</label>
            <input 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container/50 border border-outline-hairline rounded px-4 py-2 text-on-surface font-code-base text-code-base input-glow outline-none transition-shadow" 
              placeholder="••••••••" 
              required 
              type="password" 
            />
          </div>
          
          <div className="flex justify-end -mt-2">
            <a className="font-label-tech text-label-tech text-on-surface-variant hover:text-primary transition-colors" href="#">Forgot password?</a>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full text-center bg-primary-container text-white font-headline-md text-body-md py-3 rounded mt-2 hover:bg-orange-600 transition-colors shadow-[0_0_15px_rgba(255,107,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-2">
          <span className="font-body-md text-body-md text-on-surface-variant">Don't have an account? </span>
          <Link className="font-body-md text-body-md text-primary hover:text-primary-fixed transition-colors" href="/register">Sign up.</Link>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-on-surface-variant opacity-70">
        <span className="material-symbols-outlined text-[14px]">lock</span>
        <span className="font-label-tech text-label-tech">Secure 256-bit encryption. We never share your data.</span>
      </div>
    </>
  );
}