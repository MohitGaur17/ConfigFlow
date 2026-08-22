import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden font-body-md">
      
      {/* IDE Sidebar Panel */}
      <aside className="w-64 flex-shrink-0 border-r border-outline-hairline bg-surface-elevated/50 flex flex-col z-10">
        
        {/* Workspace Switcher */}
        <div className="h-14 border-b border-outline-hairline flex items-center px-4 hover:bg-surface-variant/50 cursor-pointer transition-colors">
          <div className="flex items-center gap-3 w-full">
            <div className="w-6 h-6 rounded bg-primary-container flex items-center justify-center text-[12px] font-bold text-white shadow-[0_0_10px_rgba(255,107,0,0.3)]">
              C
            </div>
            <span className="font-label-tech text-sm truncate flex-1">ConfigFlow Corp</span>
            <span className="material-symbols-outlined text-sm text-on-surface-variant">unfold_more</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto hide-scroll space-y-1 px-3">
          <div className="text-label-caps text-on-surface-variant/50 px-2 mb-3 mt-2">WORKSPACE</div>
          
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md bg-surface-variant/50 text-on-surface border border-outline-hairline">
            <span className="material-symbols-outlined text-[18px] text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
            <span className="font-label-tech">Projects</span>
          </Link>
          
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-variant/30 text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[18px]">cloud</span>
            <span className="font-label-tech">Environments</span>
          </Link>
          
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-variant/30 text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span className="font-label-tech">Team Access</span>
          </Link>
        </nav>

        {/* User Profile Footer */}
        <div className="h-14 border-t border-outline-hairline flex items-center px-4 hover:bg-surface-variant/30 cursor-pointer transition-colors">
           <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center border border-outline-hairline overflow-hidden text-on-surface-variant">
             <span className="material-symbols-outlined text-[14px]">person</span>
           </div>
           <span className="ml-3 font-code-base text-xs text-on-surface-variant truncate">dev@company.com</span>
        </div>
      </aside>

      {/* Main Stage Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background relative">
        {/* Subtle grid background for the workspace */}
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"></div>
        <div className="relative z-10 w-full h-full">
            {children}
        </div>
      </main>
      
    </div>
  );
}