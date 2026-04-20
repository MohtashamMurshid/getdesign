import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";

import { SITE_DOMAIN, SITE_GITHUB_URL, SITE_NAME } from "./_lib/site";

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

const SITE_TITLE = `${SITE_NAME} · the design system for any URL`;
const SITE_DESCRIPTION =
  "Paste a URL. An agent opens it in a real browser, extracts palette, typography, and components, and returns a production-grade design.md. Web, API, CLI, TypeScript SDK, and Skill.";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f1ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  metadataBase: new URL(SITE_DOMAIN),
  keywords: [
    "design system",
    "design tokens",
    "design.md",
    "brand tokens",
    "style guide generator",
    "URL to design system",
    "color palette extractor",
    "typography extractor",
    "component extractor",
    "AI design agent",
    "Claude Code skill",
    "Cursor skill",
    "Codex skill",
    "getdesign",
  ],
  authors: [{ name: SITE_NAME, url: SITE_DOMAIN }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_DOMAIN,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description:
      "On-demand design systems from any URL. Five surfaces, one agent.",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_DOMAIN}#organization`,
        name: SITE_NAME,
        url: SITE_DOMAIN,
        logo: `${SITE_DOMAIN}/icon.svg`,
        sameAs: [SITE_GITHUB_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_DOMAIN}#website`,
        url: SITE_DOMAIN,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_DOMAIN}#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web, macOS, Linux, Windows",
        description: SITE_DESCRIPTION,
        url: SITE_DOMAIN,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${geist.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
