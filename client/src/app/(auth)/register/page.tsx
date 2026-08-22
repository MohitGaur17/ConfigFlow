import Link from "next/link";

export default function RegisterPage() {
  return (
    <>
      <div className="glass-card w-full border border-outline-hairline rounded-xl p-8 flex flex-col shadow-2xl relative overflow-hidden">
        {/* Subtle accent top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-50"></div>
        
        <div className="text-center mb-8">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Start generating software.</h1>
          <p className="font-label-tech text-label-tech text-on-surface-variant">Create your workspace to begin.</p>
        </div>

        {/* OAuth Actions */}
        <div className="space-y-3 mb-6">
          <button type="button" className="w-full bg-surface-container hover:bg-surface-variant border border-outline-hairline rounded text-on-surface py-3 px-4 flex items-center justify-center gap-3 transition-colors">
            <svg aria-hidden="true" className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" fillRule="evenodd"></path></svg>
            <span className="font-body-md text-body-md font-medium">Continue with GitHub</span>
          </button>
          <button type="button" className="w-full bg-surface-container hover:bg-surface-variant border border-outline-hairline rounded text-on-surface py-3 px-4 flex items-center justify-center gap-3 transition-colors">
            <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor"></path></svg>
            <span className="font-body-md text-body-md font-medium">Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-outline-hairline"></div>
          <span className="font-label-tech text-label-tech text-on-surface-variant">or</span>
          <div className="flex-1 h-px bg-outline-hairline"></div>
        </div>

        {/* Form */}
        <form className="space-y-4 mb-8">
          <div>
            <label className="sr-only" htmlFor="name">Name</label>
            <input className="input-field w-full bg-surface-dim/50 text-on-surface border-0 border-b border-outline-variant px-0 py-3 focus:ring-0 focus:border-primary placeholder-on-surface-variant font-code-base text-code-base transition-colors" id="name" name="name" placeholder="Full Name" required type="text" />
          </div>
          <div>
            <label className="sr-only" htmlFor="email">Email address</label>
            <input className="input-field w-full bg-surface-dim/50 text-on-surface border-0 border-b border-outline-variant px-0 py-3 focus:ring-0 focus:border-primary placeholder-on-surface-variant font-code-base text-code-base transition-colors" id="email" name="email" placeholder="work@company.com" required type="email" />
          </div>
          <div>
            <label className="sr-only" htmlFor="password">Password</label>
            <input className="input-field w-full bg-surface-dim/50 text-on-surface border-0 border-b border-outline-variant px-0 py-3 focus:ring-0 focus:border-primary placeholder-on-surface-variant font-code-base text-code-base transition-colors" id="password" name="password" placeholder="••••••••" required type="password" />
          </div>
          <div className="pt-4">
            <button className="glow-button w-full bg-primary-container hover:bg-orange-600 text-white font-headline-md text-[16px] py-3 px-4 rounded font-bold tracking-wide" type="button">
              Create Account
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Already have an account? <Link className="text-primary hover:text-primary-fixed transition-colors underline underline-offset-4 decoration-primary/30" href="/login">Log in.</Link>
          </p>
        </div>
      </div>

      {/* Trust Indicator */}
      <div className="mt-8 flex items-center justify-center gap-2 text-on-surface-variant opacity-70">
        <span className="material-symbols-outlined text-[16px]">lock</span>
        <span className="font-label-tech text-label-tech">Secure 256-bit encryption. We never share your data.</span>
      </div>
    </>
  );
}