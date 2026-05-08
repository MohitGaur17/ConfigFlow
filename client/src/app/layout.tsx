import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ConfigFlow: Config driven AI App Generator",
  description: "Generate full-stack web applications from JSON configuration. Deploy instantly with PostgreSQL, Next.js, and REST APIs.",
  applicationName: "ConfigFlow",
  authors: [{ name: "ConfigFlow" }],
  keywords: ["app generator", "no-code", "low-code", "config-driven", "full-stack"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  manifest: "/manifest.json",
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
    title: "ConfigFlow: Config driven AI App Generator",
    description: "Generate full-stack web applications from JSON configuration instantly.",
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
    description: "Generate full-stack web applications from JSON configuration.",
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#6366f1" />
        <meta name="msapplication-TileColor" content="#0a0a0a" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-950 text-white`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
