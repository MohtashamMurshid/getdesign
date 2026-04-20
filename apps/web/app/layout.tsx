import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";

import { SITE_DOMAIN, SITE_NAME } from "./_lib/site";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${SITE_NAME} — the design system for any URL`,
  description:
    "Paste a URL. An agent opens it in a real browser, extracts tokens and components, and returns a production-grade design.md. Web, API, CLI, and TypeScript SDK.",
  metadataBase: new URL(SITE_DOMAIN),
  openGraph: {
    title: `${SITE_NAME} — the design system for any URL`,
    description:
      "Four surfaces, one agent. Web, API, CLI, and TypeScript SDK.",
    url: SITE_DOMAIN,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "On-demand design systems from any URL.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
