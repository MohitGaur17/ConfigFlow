"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useTranslation } from "@/i18n";

export default function PwaRegister() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Register service worker in production only.
    // Next dev + service workers can fight over page assets and trigger reload loops.
    if (process.env.NODE_ENV === "production" && typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const fallbackTimer =
      process.env.NODE_ENV === "production"
        ? window.setTimeout(() => {
            const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches || (window.navigator as any).standalone;
            if (!isStandalone) {
              setShowInstallPrompt(true);
            }
          }, 2000)
        : undefined;

    // Hide install prompt if app is installed
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      return;
    }

    const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches || (window.navigator as any).standalone;
    if (!isStandalone) {
      setShowInstallPrompt(true);
    }
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-sm z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white text-gray-950 rounded-xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">{t('pwa.installTitle')}</h3>
            <p className="text-xs text-gray-600">{t('pwa.installDescription')}</p>
            <button
              onClick={handleInstall}
              disabled={!deferredPrompt}
              className="mt-3 w-full bg-indigo-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {deferredPrompt ? t('pwa.installButton') : t('pwa.installButton', 'Install app')}
            </button>
            {!deferredPrompt && (
              <p className="mt-2 text-xs text-gray-500">
                Open your browser menu and choose install if the popup does not appear.
              </p>
            )}
          </div>
          <button
            onClick={() => setShowInstallPrompt(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
