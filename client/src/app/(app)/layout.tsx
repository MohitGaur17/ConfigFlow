export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden font-body-md">
      {/* Main Stage Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background relative">
        {/* Subtle grid background for the workspace */}
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"></div>
        <div className="relative z-10 w-full h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}