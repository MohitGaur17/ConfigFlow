"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16H5m13-4v6m0 0v2m0-2v-2m0 2h2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2">You're Offline</h1>
        <p className="text-gray-400 mb-6">
          Looks like you've lost your internet connection. Some features may be limited.
        </p>
        <p className="text-sm text-gray-500">
          Your data will sync automatically when you're back online.
        </p>
      </div>
    </div>
  );
}
