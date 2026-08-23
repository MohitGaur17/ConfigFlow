import Link from "next/link";

export default function MissionPage() {
  return (
    <div className="font-body-md antialiased bg-background min-h-screen pt-24 pb-32">
      <div className="max-w-5xl mx-auto px-margin-safe">
        
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-outline-variant bg-surface-container-low mb-8">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-widest">Our Mission</span>
          </div>
          <h1 className="text-display-hero font-display-hero text-on-surface mb-6">
            Software should be <span className="text-primary-container">generated</span>, not written.
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-8 text-body-lg text-on-surface-variant leading-relaxed">
          <p>
            For the past two decades, the software industry has been trapped in a cycle of writing the same boilerplate code over and over again. Every new project requires setting up a database, configuring authentication, wiring up API routes, and building basic CRUD interfaces.
          </p>
          <p>
            We believe that human engineers are too valuable to spend their time writing boilerplate. 
          </p>
          
          <div className="glass-panel p-8 my-12 rounded-xl border-l-4 border-l-primary-container">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-4">The ConfigFlow Manifesto</h3>
            <ul className="space-y-4 text-body-md font-code-base">
              <li className="flex items-start gap-4">
                <span className="text-primary-container">01.</span>
                <span>Architecture should be defined declaratively, not imperatively.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-primary-container">02.</span>
                <span>Machines should write the boilerplate. Humans should write the business logic.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-primary-container">03.</span>
                <span>Generated code must be clean, standard, and vendor-agnostic. No lock-in.</span>
              </li>
            </ul>
          </div>

          <p>
            ConfigFlow was built to bridge the gap between idea and production. By defining your architecture in a single, strictly-typed JSON configuration, our engine can orchestrate the entire full-stack application in minutes.
          </p>
          <p>
            We are building the operating system for software generation. We invite you to build the future with us.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-20 pt-12 border-t border-outline-hairline flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-4xl text-primary-container">account_tree</span>
            <div>
              <div className="text-label-caps font-label-caps text-on-surface">THE CONFIGFLOW TEAM</div>
              <div className="text-sm text-on-surface-variant">Rajasthan, India</div>
            </div>
          </div>
          <Link href="/register" className="bg-surface-elevated hover:bg-surface-container-high border border-outline-variant text-on-surface px-6 py-3 rounded-md text-sm font-bold transition-colors">
            Join the Platform
          </Link>
        </div>

      </div>
    </div>
  );
}