import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="flex-grow flex flex-col items-center justify-center p-gutter md:p-margin-safe max-w-container-max mx-auto w-full relative min-h-screen">
      
      {/* Hero Section */}
      <section className="text-center mb-16 relative z-10 pt-20">
        <h1 className="font-display-hero text-display-hero mb-6 text-on-surface">How can we help?</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Need help with JSON schemas, want to report a bug, or have a feature request? Select the appropriate channel below.
        </p>
      </section>

      {/* Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl z-10 mb-20">
        
        {/* Card 1: GitHub */}
        <div className="bento-card rounded-xl p-8 flex flex-col items-start gap-4 h-full min-h-[250px]">
          <div className="text-primary glow-icon mb-2">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>bug_report</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Report a Bug or Contribute</h2>
          <p className="font-body-md text-body-md text-on-surface-variant flex-grow">Help us improve the core engine. Submit issues or PRs directly to our repository.</p>
          <a href="#" className="mt-4 border border-outline-hairline text-on-surface hover:border-primary hover:text-primary transition-colors px-6 py-2 rounded font-label-tech text-label-tech">Open GitHub Issue</a>
        </div>

        {/* Card 2: Roadmap */}
        <div className="bento-card rounded-xl p-8 flex flex-col items-start gap-4 h-full min-h-[250px]">
          <div className="text-primary glow-icon mb-2">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Request a Feature</h2>
          <p className="font-body-md text-body-md text-on-surface-variant flex-grow">Have an idea for a new component or configuration option? Let us know.</p>
          <a href="#" className="mt-4 border border-outline-hairline text-on-surface hover:border-primary hover:text-primary transition-colors px-6 py-2 rounded font-label-tech text-label-tech">View Roadmap</a>
        </div>

        {/* Card 3: Discord */}
        <div className="bento-card rounded-xl p-8 flex flex-col items-start gap-4 h-full min-h-[250px]">
          <div className="text-primary glow-icon mb-2">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Developer Discord</h2>
          <p className="font-body-md text-body-md text-on-surface-variant flex-grow">Join the community. Get real-time help, discuss schemas, and connect with other engineers.</p>
          <a href="#" className="mt-4 bg-primary-container text-white px-6 py-2 rounded font-label-tech text-label-tech shadow-[0_0_15px_rgba(255,107,0,0.4)] hover:opacity-90 transition-opacity">Join Discord</a>
        </div>

        {/* Card 4: Direct Support */}
        <div className="bento-card rounded-xl p-8 flex flex-col items-start gap-4 h-full min-h-[250px]">
          <div className="text-primary glow-icon mb-2">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Direct Support</h2>
          <p className="font-body-md text-body-md text-on-surface-variant flex-grow">For private inquiries, billing issues, or enterprise support SLAs.</p>
          <a href="#" className="mt-4 border border-outline-hairline text-on-surface hover:border-primary hover:text-primary transition-colors px-6 py-2 rounded font-label-tech text-label-tech">Contact Us</a>
        </div>

      </section>
      
    </main>
  );
}