import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "ConfigFlow: Declarative JSON-Driven Full-Stack App Generator",
  description: "Generate full-stack web applications from JSON configuration. Preview instantly with dynamic UI and export clean Next.js, Prisma, and PostgreSQL code.",
  applicationName: "ConfigFlow",
  authors: [{ name: "ConfigFlow" }],
  keywords: ["app generator", "no-code", "low-code", "config-driven", "full-stack", "nextjs", "prisma"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ConfigFlow",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://configflow.ai",
    title: "ConfigFlow: Declarative JSON-Driven Full-Stack App Generator",
    description: "Generate full-stack web applications from JSON configuration with instant live preview and clean code export.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ConfigFlow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ConfigFlow",
    description: "Generate full-stack web applications from JSON configuration with instant live preview and clean code export.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-gray-950 text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
