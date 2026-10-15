"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Menu,
  X,
  Workflow,
  Layers,
  Sparkles,
  Compass,
  LifeBuoy,
  ChevronRight,
  ArrowRight,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

const NAV_LINKS = [
  {
    name: "How it Works",
    href: "/#how-it-works",
    icon: Workflow,
    description: "Declarative architecture pipeline",
  },
  {
    name: "Features",
    href: "/#features",
    icon: Layers,
    description: "Next.js, Prisma, PostgreSQL & responsive UI",
  },
  {
    name: "Use Cases",
    href: "/#use-cases",
    icon: Sparkles,
    description: "CRMs, Admin Panels & Internal Tools",
  },
  {
    name: "Mission",
    href: "/mission",
    icon: Compass,
    description: "The ConfigFlow engineering manifesto",
  },
  {
    name: "Support",
    href: "/support",
    icon: LifeBuoy,
    description: "GitHub issues, discussions & contact",
  },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Lock body scroll while mobile drawer is open to prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || isOpen
          ? "bg-surface-container/90 backdrop-blur-md border-b border-outline-variant/50 shadow-lg"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="flex justify-between items-center w-full px-4 sm:px-6 md:px-margin-safe h-16 max-w-container-max mx-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 500 350"
              width="40"
              height="28"
              className="flex-shrink-0 sm:w-[46px] sm:h-[32px]"
            >
              <g>
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
                <rect x="70" y="110" width="120" height="120" rx="17.5" fill="#FF6B00" />
                <rect x="230" y="130" width="80" height="80" rx="14" fill="#FF6B00" />
                <rect x="350" y="130" width="80" height="80" rx="14" fill="#FF6B00" />
              </g>
            </svg>
            <span className="text-xl sm:text-headline-md font-headline-md font-black tracking-tighter text-on-surface">
              ConfigFlow
            </span>
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {mounted && isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-surface-elevated hover:bg-surface-container-high border border-outline-hairline text-on-surface px-3.5 py-1.5 rounded text-sm font-label-tech transition-colors shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4 text-primary-container" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-on-surface-variant hover:text-white hover:bg-surface-variant/30 rounded border border-transparent hover:border-outline-hairline transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-on-surface hover:text-primary transition-colors text-sm font-medium px-3 py-1.5 rounded hover:bg-surface-variant/20"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-primary-container hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,107,0,0.35)] active:scale-95"
              >
                Start Building
              </Link>
            </>
          )}
        </div>

        {/* Mobile Header Actions: Quick CTA + Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {mounted && isAuthenticated ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-container border border-outline-hairline text-xs font-label-tech text-on-surface"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-primary-container" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/register"
              className="px-3 py-1.5 rounded bg-primary-container hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-[0_0_10px_rgba(255,107,0,0.3)]"
            >
              Get Started
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-2 rounded-lg border border-outline-hairline bg-surface-container/60 hover:bg-surface-container text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container/50"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {isOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay (Tap to Dismiss) */}
      {isOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Drawer Sheet */}
      <div
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
        className={`fixed top-16 left-0 right-0 max-h-[calc(100svh-4rem)] bg-surface-container-lowest/95 backdrop-blur-2xl border-b border-outline-hairline shadow-2xl overflow-y-auto z-50 md:hidden transition-all duration-300 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto visible"
            : "opacity-0 -translate-y-2 pointer-events-none invisible"
        }`}
      >
        <div className="p-4 sm:p-6 space-y-4">
          {/* Navigation Links Group */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest">
              Navigation
            </div>
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-surface-container border border-outline-hairline flex items-center justify-center text-primary-container group-hover:bg-primary-container/10 group-hover:border-primary-container/40 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {link.name}
                      </div>
                      <div className="text-xs text-on-surface-variant font-code-base opacity-75">
                        {link.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-outline-hairline" />

          {/* Auth & Session Controls */}
          <div className="space-y-2 pt-1">
            {mounted && isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-outline-hairline">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-label-tech text-on-surface truncate">
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-tertiary">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                        <span>Authenticated</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-error transition-colors px-2 py-1 rounded hover:bg-surface-variant/30"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-primary-container hover:bg-orange-600 text-white text-sm font-bold shadow-[0_0_15px_rgba(255,107,0,0.35)] transition-all active:scale-[0.98]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-primary-container hover:bg-orange-600 text-white text-sm font-bold shadow-[0_0_15px_rgba(255,107,0,0.35)] transition-all active:scale-[0.98]"
                >
                  <span>Start Building (Free)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-full py-2.5 px-4 rounded-lg border border-outline-hairline bg-surface-container hover:bg-surface-variant text-on-surface text-sm font-medium transition-colors"
                >
                  Sign In to Account
                </Link>
              </div>
            )}
          </div>

          {/* Drawer Bottom Bar */}
          <div className="pt-2 flex items-center justify-between text-[11px] font-label-tech text-on-surface-variant border-t border-outline-hairline/60">
            <span>ConfigFlow v1.0.0</span>
            <Link
              href="/support"
              onClick={() => setIsOpen(false)}
              className="hover:text-primary transition-colors"
            >
              Need Help?
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}