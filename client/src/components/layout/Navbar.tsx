"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  // Listen for scroll events to trigger the glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-surface-container/80 backdrop-blur-md border-b border-outline-variant/50 shadow-lg" 
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="flex justify-between items-center w-full px-margin-safe h-16 max-w-container-max mx-auto">
        <div className="flex items-center gap-2">
          
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" width="46" height="32" className="flex-shrink-0">
              <g>
                <path d="M 130 120 V 60 H 270 V 140" fill="none" stroke="#FF6B00" strokeWidth="10" strokeLinejoin="miter" strokeLinecap="square" />
                <path d="M 300 170 H 360" fill="none" stroke="#FF6B00" strokeWidth="10" strokeLinejoin="miter" strokeLinecap="square" />
                <path d="M 130 220 V 280 H 390 V 200" fill="none" stroke="#FF6B00" strokeWidth="10" strokeLinejoin="miter" strokeLinecap="square" />
                <rect x="70" y="110" width="120" height="120" rx="17.5" fill="#FF6B00" />
                <rect x="230" y="130" width="80" height="80" rx="14" fill="#FF6B00" />
                <rect x="350" y="130" width="80" height="80" rx="14" fill="#FF6B00" />
              </g>
            </svg>
            <span className="text-headline-md font-headline-md font-black tracking-tighter text-on-surface">
              ConfigFlow
            </span>
          </Link>

        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#how-it-works" className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200">
            How it Works
          </Link>
          <Link href="/#features" className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200">
            Features
          </Link>
          <Link href="/#use-cases" className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200">
            Use Cases
          </Link>
          <Link href="/mission" className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200">
            Mission
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-on-surface hover:text-primary transition-colors text-sm font-medium">
            Login
          </Link>
          <Link href="/register" className="bg-primary-container hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-bold transition-colors shadow-[0_0_15px_rgba(255,107,0,0.4)]">
            Start Building
          </Link>
        </div>
      </div>
    </nav>
  );
}