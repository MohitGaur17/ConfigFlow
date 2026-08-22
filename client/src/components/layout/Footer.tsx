import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-outline-hairline bg-surface-container-lowest pt-16 pb-8">
      <div className="max-w-container-max mx-auto px-margin-safe grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" width="58" height="40" className="flex-shrink-0">
              <defs>

              </defs>

              <g >
                {/* Connection Circuit Lines  */}
                <path
                  d="M 130 120 V 60 H 270 V 140"
                  fill="none"
                  stroke="#FF6B00"
                  strokeWidth="10"
                  strokeLinejoin="miter"
                  strokeLinecap="square"
                />
                <path
                  d="M 300 170 H 360"
                  fill="none"
                  stroke="#FF6B00"
                  strokeWidth="10"
                  strokeLinejoin="miter"
                  strokeLinecap="square"
                />
                <path
                  d="M 130 220 V 280 H 390 V 200"
                  fill="none"
                  stroke="#FF6B00"
                  strokeWidth="10"
                  strokeLinejoin="miter"
                  strokeLinecap="square"
                />

                {/* Architectural Nodes  */}
                <rect
                  x="70"
                  y="110"
                  width="120"
                  height="120"
                  rx="17.5"
                  fill="#FF6B00"
                />
                <rect
                  x="230"
                  y="130"
                  width="80"
                  height="80"
                  rx="14"
                  fill="#FF6B00"
                />
                <rect
                  x="350"
                  y="130"
                  width="80"
                  height="80"
                  rx="14"
                  fill="#FF6B00"
                />
              </g>
            </svg>
            <span className="text-body-md font-bold text-on-surface">ConfigFlow</span>

          </div>
          <p className="text-label-tech text-on-surface-variant">The operating system for software generation.</p>
        </div>
                <div>
          <h4 className="text-label-caps font-label-caps text-on-surface mb-4 tracking-widest">PRODUCT</h4>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            <li><Link href="/#how-it-works" className="hover:text-primary transition-colors">How it Works</Link></li>
            <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-label-caps font-label-caps text-on-surface mb-4 tracking-widest">COMPANY</h4>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            <li><Link href="/mission" className="hover:text-primary transition-colors">Mission</Link></li>
            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog (Coming Soon)</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-label-caps font-label-caps text-on-surface mb-4 tracking-widest">SUPPORT</h4>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            <li><Link href="/support" className="hover:text-primary transition-colors">Contact Support</Link></li>
            <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation (Coming Soon)</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-container-max mx-auto px-margin-safe pt-8 border-t border-outline-hairline flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
        <div>© 2024 ConfigFlow Engineering. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span> System Operational
          </div>
        </div>
      </div>
    </footer>
  );
}