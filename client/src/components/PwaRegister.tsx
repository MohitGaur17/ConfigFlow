"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Register service worker in production or when explicitly enabled
    const shouldRegister =
      process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "true";

    if (shouldRegister && typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((error) => {
          console.warn("[PWA] Service Worker registration failed:", error);
        });
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Hide install prompt if app is already installed
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User response: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-sm z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#11141A] text-white rounded-2xl shadow-2xl border border-white/10 p-4 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(255,107,0,0.35)]">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-white mb-0.5">Install ConfigFlow</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access your apps offline and from your home screen.
            </p>
            <button
              type="button"
              onClick={handleInstall}
              className="mt-3 w-full bg-primary-container hover:bg-orange-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all shadow-[0_0_10px_rgba(255,107,0,0.3)] active:scale-95"
            >
              Install Now
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowInstallPrompt(false)}
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-white/5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
