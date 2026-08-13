"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heroSection = heroRef.current;
    const mouseGlow = glowRef.current;

    if (heroSection && mouseGlow) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = heroSection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        mouseGlow.style.left = `${x}px`;
        mouseGlow.style.top = `${y}px`;
      };

      heroSection.addEventListener('mousemove', handleMouseMove);
      heroSection.addEventListener('mouseleave', () => {
        mouseGlow.style.left = '50%';
        mouseGlow.style.top = '50%';
      });

      return () => {
        heroSection.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  return (
    <div className="font-body-md antialiased selection:bg-primary-container selection:text-white bg-grid min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative max-w-container-max mx-auto px-margin-safe py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12" id="hero-section">
        <div ref={glowRef} id="mouse-glow" style={{ left: '50%', top: '50%' }}></div>
        <div className="flex-1 z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-outline-variant bg-surface-container-low mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-widest">Configuration is the new compiler</span>
          </div>
          <h1 className="text-display-hero font-display-hero text-on-surface mb-6">
            <div className="reveal-text-1">Define it.</div>
            <div className="reveal-text-2">Generate it.</div>
            <div className="reveal-text-3 text-primary-container">Ship it.</div>
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant mb-10 max-w-xl">
            Describe your software architecture in JSON. ConfigFlow's generation engine orchestrates the architecture and generates a production-ready Next.js system in minutes.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/register" className="bg-primary-container hover:bg-orange-600 text-white px-6 py-3 rounded-md text-body-md font-bold transition-all shadow-[0_0_20px_rgba(255,107,0,0.5)] flex items-center gap-2 shine-effect">
              Start Building Free
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <Link href="#how-it-works" className="glass-panel hover:bg-white/5 text-on-surface px-6 py-3 rounded-md text-body-md font-medium transition-colors flex items-center gap-2 shine-effect">
              <span className="material-symbols-outlined text-sm">play_circle</span>
              See How It Works
            </Link>
          </div>
          <div className="mt-12 pt-8 border-t border-outline-hairline flex gap-8">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-sm">memory</span>
              <span className="text-label-tech font-label-tech text-on-surface-variant">Config-Driven Architecture</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-sm">verified</span>
              <span className="text-label-tech font-label-tech text-on-surface-variant">Production Ready</span>
            </div>
          </div>
        </div>

        {/* Abstract Isometric Diagram */}
        <div className="flex-1 relative w-full lg:h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-container/5 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute w-full h-[1px] bg-outline-variant/20 top-1/2"></div>
          <div className="absolute h-full w-[1px] bg-outline-variant/20 left-1/2"></div>
          <div className="absolute w-[400px] h-[400px] border border-outline-variant/10 rounded-full"></div>
          <div className="absolute w-[250px] h-[250px] border border-outline-variant/20 rounded-full"></div>

          <div className="relative z-10 flex items-start justify-between w-full max-w-2xl px-4 float-diagram pt-8">
            <div className="absolute top-[64px] left-[5rem] right-[5rem] h-[2px] bg-outline-variant/30 -z-10"></div>
            <div className="absolute top-[64px] left-[5rem] w-[calc(50%-7rem)] h-[2px] -z-10 overflow-hidden">
              <div className="absolute top-0 h-full w-12 bg-gradient-to-r from-transparent via-primary-container to-primary-container animate-[circuitPulse1_3s_linear_infinite]"></div>
            </div>
            <div className="absolute top-[64px] right-[5rem] w-[calc(50%-7rem)] h-[2px] -z-10 overflow-hidden">
              <div className="absolute top-0 h-full w-12 bg-gradient-to-r from-transparent via-primary-container to-primary-container animate-[circuitPulse2_3s_linear_infinite]"></div>
            </div>

            <div className="flex flex-col items-center gap-4 bg-background px-2 relative z-10 w-24">
              <div className="w-16 h-16 rounded bg-surface-container border border-outline-variant flex items-center justify-center hover-lift cursor-default relative">
                <span className="material-symbols-outlined text-on-surface-variant/60">chat_bubble_outline</span>
              </div>
              <span className="text-label-caps font-label-caps text-on-surface-variant/40 tracking-[0.2em] text-[9px] text-center">DEFINE</span>
            </div>

            <div className="flex flex-col items-center gap-4 bg-background px-2 relative z-10 w-32 -mt-4">
              <div className="w-20 h-24 rounded border-2 border-primary-container/30 bg-surface-elevated flex flex-col items-center justify-center relative hover-lift cursor-default animate-[circuitEngine_3s_ease-in-out_infinite]">
                <span className="material-symbols-outlined text-primary-container text-3xl mb-2">code</span>
                <div className="w-10 h-1 bg-primary-container/30 rounded-full mb-1"></div>
                <div className="w-6 h-1 bg-primary-container/30 rounded-full"></div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[1px] h-24 bg-gradient-to-b from-primary-container to-transparent opacity-50"></div>
              </div>
              <span className="text-label-caps font-label-caps text-primary-container tracking-[0.3em] text-[10px] font-bold text-center mt-2">CONFIG</span>
            </div>

            <div className="flex flex-col items-center gap-4 bg-background px-2 relative z-10 w-24">
              <div className="w-16 h-16 rounded bg-surface-container border border-tertiary-container/30 flex items-center justify-center hover-lift cursor-default shadow-[0_0_20px_rgba(0,174,120,0.1)] relative">
                <span className="material-symbols-outlined text-tertiary-container">layers</span>
              </div>
              <span className="text-label-caps font-label-caps text-tertiary-container/80 tracking-[0.2em] text-[9px] text-center">PRODUCTION</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Band */}
      <section className="border-y border-outline-hairline bg-surface-container-low py-8">
        <div className="max-w-container-max mx-auto px-margin-safe flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined">language</span>
            <span className="text-label-caps font-label-caps">NEXT.JS</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined">code</span>
            <span className="text-label-caps font-label-caps">REACT</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined">api</span>
            <span className="text-label-caps font-label-caps">EXPRESS</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined">database</span>
            <span className="text-label-caps font-label-caps">POSTGRESQL</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined">schema</span>
            <span className="text-label-caps font-label-caps">PRISMA</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined">palette</span>
            <span className="text-label-caps font-label-caps">TAILWIND CSS</span>
          </div>
        </div>
      </section>

      {/* Problem / Workflow Comparison */}
      <section className="max-w-container-max mx-auto px-margin-safe py-20 border-t border-outline-hairline">
        <div className="text-center mb-16">
          <h2 className="text-label-caps font-label-caps text-primary-container tracking-widest mb-2">THE PROBLEM</h2>
          <h3 className="text-headline-lg font-headline-lg text-on-surface mb-4">Stop writing boilerplate.</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Traditional */}
          <div className="glass-panel p-8 rounded-xl border border-error-container/30">
            <h4 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-error">warning</span>
              Traditional Development
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
                <span className="text-on-surface-variant text-body-md">Timeline</span>
                <span className="text-error font-label-tech">Weeks to Months</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
                <span className="text-on-surface-variant text-body-md">APIs</span>
                <span className="text-error font-label-tech">Manual implementation</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
                <span className="text-on-surface-variant text-body-md">Database</span>
                <span className="text-error font-label-tech">Manual schemas & migrations</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant text-body-md">UI Components</span>
                <span className="text-error font-label-tech">Manual wiring & state</span>
              </div>
            </div>
          </div>

          {/* ConfigFlow */}
          <div className="glass-panel p-8 rounded-xl border border-primary-container/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-9xl text-primary-container">bolt</span>
            </div>
            <h4 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined text-primary-container">check_circle</span>
              ConfigFlow
            </h4>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
                <span className="text-on-surface-variant text-body-md">Timeline</span>
                <span className="text-primary-container font-label-tech">Minutes</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
                <span className="text-on-surface-variant text-body-md">APIs</span>
                <span className="text-primary-container font-label-tech">Auto-generated CRUD</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
                <span className="text-on-surface-variant text-body-md">Database</span>
                <span className="text-primary-container font-label-tech">Auto-generated schemas</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant text-body-md">UI Components</span>
                <span className="text-primary-container font-label-tech">Auto-generated & wired</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Generate Section (Showpiece) */}
      <section className="max-w-container-max mx-auto px-margin-safe py-20 border-t border-outline-hairline" id="how-it-works">
        <div className="text-center mb-16">
          <h2 className="text-label-caps font-label-caps text-primary-container tracking-widest mb-2">THE ENGINE</h2>
          <h3 className="text-headline-lg font-headline-lg text-on-surface mb-4">A complete, production-ready architecture.</h3>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">Every layer. Every file. Every configuration. Generated, connected, and ready to scale.</p>
        </div>
        <div className="glass-panel rounded-xl border border-outline-hairline p-1 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* JSON Input Left */}
            <div className="lg:col-span-4 rounded bg-terminal-bg border border-outline-variant/50 p-4 font-code-base text-code-base h-full flex flex-col">
              <div className="flex gap-2 mb-4 pb-2 border-b border-outline-variant/50">
                <div className="w-3 h-3 rounded-full bg-error-red/50"></div>
                <div className="w-3 h-3 rounded-full bg-warning-amber/50"></div>
                <div className="w-3 h-3 rounded-full bg-tertiary/50"></div>
                <span className="text-label-tech text-on-surface-variant ml-2">config.json</span>
              </div>
              <pre className="text-on-surface-variant overflow-x-auto hide-scroll text-sm">
                {`{
  "`}<span className="text-code-indigo">project</span>{`": "`}<span className="text-primary">SaaS CRM</span>{`",
  "`}<span className="text-code-indigo">models</span>{`": [
    {
      "`}<span className="text-code-indigo">name</span>{`": "`}<span className="text-primary">Customer</span>{`",
      "`}<span className="text-code-indigo">fields</span>{`": {
        "`}<span className="text-code-indigo">email</span>{`": "`}<span className="text-primary">String @unique</span>{`",
        "`}<span className="text-code-indigo">status</span>{`": "`}<span className="text-primary">Enum</span>{`"
      }
    }
  ],
  "`}<span className="text-code-indigo">features</span>{`": [
    "`}<span className="text-primary">auth</span>{`",
    "`}<span className="text-primary">api_routes</span>{`",
    "`}<span className="text-primary">dashboard_ui</span>{`"
  ]
}`}
              </pre>
            </div>

            {/* Engine Core Middle */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center relative py-12">
              <div className="hidden lg:block absolute left-0 top-1/2 w-full h-[1px] bg-gradient-to-r from-outline-variant via-primary-container to-outline-variant -z-10"></div>
              <div className="w-24 h-24 rounded-2xl bg-surface-elevated border border-primary-container shadow-[0_0_40px_rgba(255,107,0,0.2)] flex items-center justify-center relative z-10 hover-lift">
                <span className="material-symbols-outlined text-4xl text-primary-container animate-pulse">settings_b_roll</span>
              </div>
              <div className="mt-4 text-label-caps font-label-caps text-primary tracking-widest text-center">
                GENERATION ENGINE<br />
                <span className="text-[9px] text-on-surface-variant">RESOLVING DEPENDENCIES</span>
              </div>
            </div>

            {/* Outputs Right */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-panel p-4 rounded border-l-2 border-l-tertiary-container flex items-center gap-4 hover-lift">
                <span className="material-symbols-outlined text-tertiary-container">database</span>
                <div>
                  <div className="text-label-caps text-on-surface font-label-caps mb-1">DATABASE</div>
                  <div className="text-code-base font-code-base text-on-surface-variant text-xs">schema.prisma generated</div>
                </div>
              </div>
              <div className="glass-panel p-4 rounded border-l-2 border-l-secondary-container flex items-center gap-4 hover-lift">
                <span className="material-symbols-outlined text-secondary-container">api</span>
                <div>
                  <div className="text-label-caps text-on-surface font-label-caps mb-1">BACKEND API</div>
                  <div className="text-code-base font-code-base text-on-surface-variant text-xs">Next.js Route Handlers</div>
                </div>
              </div>
              <div className="glass-panel p-4 rounded border-l-2 border-l-primary-container flex items-center gap-4 hover-lift">
                <span className="material-symbols-outlined text-primary-container">web</span>
                <div>
                  <div className="text-label-caps text-on-surface font-label-caps mb-1">FRONTEND</div>
                  <div className="text-code-base font-code-base text-on-surface-variant text-xs">React Server Components</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-container-max mx-auto px-margin-safe py-20 border-t border-outline-hairline" id="features">
        <div className="text-center mb-16">
          <h2 className="text-label-caps font-label-caps text-primary-container tracking-widest mb-2">FEATURES</h2>
          <h3 className="text-headline-lg font-headline-lg text-on-surface mb-4">Everything you need. Out of the box.</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-4">
            <span className="material-symbols-outlined text-3xl text-primary-container">table_chart</span>
            <h4 className="text-body-lg font-bold text-on-surface">Dynamic Data Tables</h4>
            <p className="text-sm text-on-surface-variant">Auto-generated tables with sorting, filtering, and pagination built-in.</p>
          </div>
          <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-4">
            <span className="material-symbols-outlined text-3xl text-primary-container">format_align_left</span>
            <h4 className="text-body-lg font-bold text-on-surface">Smart Forms</h4>
            <p className="text-sm text-on-surface-variant">Client and server-side validation derived directly from your schema.</p>
          </div>
          <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-4">
            <span className="material-symbols-outlined text-3xl text-primary-container">monitoring</span>
            <h4 className="text-body-lg font-bold text-on-surface">Dashboards & Charts</h4>
            <p className="text-sm text-on-surface-variant">Visual components wired to aggregate your data automatically.</p>
          </div>
          <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-4">
            <span className="material-symbols-outlined text-3xl text-primary-container">admin_panel_settings</span>
            <h4 className="text-body-lg font-bold text-on-surface">Built-in Auth</h4>
            <p className="text-sm text-on-surface-variant">Secure user management, roles, and session handling ready to go.</p>
          </div>
          <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-4">
            <span className="material-symbols-outlined text-3xl text-primary-container">offline_bolt</span>
            <h4 className="text-body-lg font-bold text-on-surface">PWA Support</h4>
            <p className="text-sm text-on-surface-variant">Offline caching and installability configured by default.</p>
          </div>
          <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-4">
            <span className="material-symbols-outlined text-3xl text-primary-container">file_download</span>
            <h4 className="text-body-lg font-bold text-on-surface">Standalone Export</h4>
            <p className="text-sm text-on-surface-variant">Export clean, standard Next.js code. No vendor lock-in.</p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="max-w-container-max mx-auto px-margin-safe py-20 border-t border-outline-hairline bg-surface-container-low/50" id="use-cases">
        <div className="text-center mb-16">
          <h2 className="text-label-caps font-label-caps text-primary-container tracking-widest mb-2">USE CASES</h2>
          <h3 className="text-headline-lg font-headline-lg text-on-surface mb-4">Built for any domain.</h3>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="glass-panel px-8 py-6 rounded-full border border-outline-variant/50 text-center min-w-[200px]">
            <span className="text-body-md font-bold text-on-surface">Internal Tools</span>
          </div>
          <div className="glass-panel px-8 py-6 rounded-full border border-outline-variant/50 text-center min-w-[200px]">
            <span className="text-body-md font-bold text-on-surface">Admin Panels</span>
          </div>
          <div className="glass-panel px-8 py-6 rounded-full border border-outline-variant/50 text-center min-w-[200px]">
            <span className="text-body-md font-bold text-on-surface">CRMs</span>
          </div>
          <div className="glass-panel px-8 py-6 rounded-full border border-outline-variant/50 text-center min-w-[200px]">
            <span className="text-body-md font-bold text-on-surface">Inventory Management</span>
          </div>
          <div className="glass-panel px-8 py-6 rounded-full border border-outline-variant/50 text-center min-w-[200px]">
            <span className="text-body-md font-bold text-on-surface">MVPs</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-container-max mx-auto px-margin-safe py-32 text-center">
        <h2 className="text-headline-lg font-headline-lg text-on-surface mb-6">Ready to build your next app in minutes?</h2>
        <p className="text-body-md text-on-surface-variant mb-10">Join developers who are shipping faster with ConfigFlow.</p>
        <Link href="/register" className="inline-block bg-primary-container hover:bg-orange-600 text-white px-8 py-4 rounded-md text-body-lg font-bold transition-all shadow-[0_0_20px_rgba(255,107,0,0.5)] shine-effect">
          Start Building Now
        </Link>
      </section>
    </div>
  );
}