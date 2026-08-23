import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-on-surface font-body-md text-body-md antialiased min-h-screen relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-background/40 -z-10"></div>
      
      {/* Header */}
      <header className="w-full px-margin-safe py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" width="32" height="22" className="flex-shrink-0">
              <g>
                <path d="M 130 120 V 60 H 270 V 140" fill="none" stroke="#FF6B00" strokeWidth="10" strokeLinejoin="miter" strokeLinecap="square" />
                <path d="M 300 170 H 360" fill="none" stroke="#FF6B00" strokeWidth="10" strokeLinejoin="miter" strokeLinecap="square" />
                <path d="M 130 220 V 280 H 390 V 200" fill="none" stroke="#FF6B00" strokeWidth="10" strokeLinejoin="miter" strokeLinecap="square" />
                <rect x="70" y="110" width="120" height="120" rx="17.5" fill="#FF6B00" />
                <rect x="230" y="130" width="80" height="80" rx="14" fill="#FF6B00" />
                <rect x="350" y="130" width="80" height="80" rx="14" fill="#FF6B00" />
              </g>
            </svg>
            <span className="font-headline-md text-headline-md font-black tracking-tighter text-on-surface">ConfigFlow</span>
          </Link>
        </div>
        <Link className="text-on-surface-variant hover:text-primary transition-colors duration-200 flex items-center gap-2 font-label-caps text-label-caps" href="/">
          <span>Back to Home</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-gutter py-12 z-10 w-full max-w-[480px] mx-auto">
        {children}
      </main>
    </div>
  );
}