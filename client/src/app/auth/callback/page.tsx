"use client";

import { Suspense } from "react";
import OAuthCallbackContent from "./callback-content";

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<OAuthCallbackFallback />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}

function OAuthCallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
        <p className="text-sm text-white/60">Completing sign in...</p>
      </div>
    </div>
  );
}
