import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 border-b border-outline-hairline pb-6">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface mb-2">Projects</h1>
          <p className="text-sm font-code-base text-on-surface-variant">Manage and orchestrate your generated applications.</p>
        </div>
        <Link href="/builder" className="bg-primary-container hover:bg-orange-600 text-white px-5 py-2.5 rounded text-label-tech font-label-tech transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,107,0,0.3)]">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Project
        </Link>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Example Project Card */}
        <div className="glass-panel border border-outline-hairline rounded-lg overflow-hidden group hover:border-primary-container/50 transition-colors flex flex-col">
          {/* Status Line */}
          <div className="h-1 bg-gradient-to-r from-tertiary to-tertiary-container w-full"></div>
          
          <div className="p-5 flex-1">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-headline-md text-lg text-on-surface">SaaS CRM Template</h3>
              <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
              </button>
            </div>
            
            <p className="text-xs font-code-base text-on-surface-variant mb-6 leading-relaxed">
              Full-stack Next.js application with PostgreSQL schema, Prisma auth, and dashboard components.
            </p>
            
            {/* Environment Badges */}
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-0.5 rounded-sm bg-tertiary-container/10 border border-tertiary-container/30 text-[10px] font-label-caps text-tertiary-container tracking-widest">
                PRODUCTION
              </span>
              <span className="text-[11px] font-code-base text-on-surface-variant flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                Healthy
              </span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="border-t border-outline-hairline bg-surface-elevated/50 p-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2 text-[11px] font-code-base text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">commit</span>
              v1.2.4 deployed 2h ago
            </div>
            <Link href="/builder" className="text-xs font-label-tech text-primary-container hover:text-primary transition-colors flex items-center gap-1">
              Open Builder <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
        
        {/* Empty State Card (To encourage creating a new project) */}
        <Link href="/builder" className="glass-panel border border-outline-hairline border-dashed rounded-lg flex flex-col items-center justify-center p-8 hover:border-primary-container/50 hover:bg-primary-container/5 transition-all text-on-surface-variant hover:text-primary-container group min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-surface-elevated border border-outline-hairline flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
            <span className="material-symbols-outlined text-2xl">add</span>
          </div>
          <span className="font-label-tech text-sm">Create New Project</span>
        </Link>

      </div>
    </div>
  );
}