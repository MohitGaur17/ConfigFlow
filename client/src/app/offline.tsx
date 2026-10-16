"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      window.location.reload();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    if (typeof window !== "undefined" && navigator.onLine) {
      window.location.reload();
    } else {
      setTimeout(() => setRetrying(false), 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-4 py-8">
      <div className="text-center max-w-md w-full bg-[#11141A] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span>Offline</span>
        </div>

        <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-indigo-500/20 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary shadow-[0_0_20px_rgba(255,107,0,0.2)]">
          <WifiOff className="w-8 h-8 text-[#FF6B00]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 tracking-tight">You're Offline</h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Looks like you've lost your internet connection. Some features may be limited.
        </p>
        <p className="text-xs text-slate-500 mb-8">
          Your data will sync automatically when you're back online.
        </p>

        <button
          onClick={handleRetry}
          disabled={retrying}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-primary-container hover:bg-orange-600 text-white font-bold text-sm shadow-[0_0_15px_rgba(255,107,0,0.35)] transition-all active:scale-95 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
          <span>Retry Connection</span>
        </button>
      </div>
    </div>
  );
}
