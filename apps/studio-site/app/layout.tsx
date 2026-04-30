import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";

import { JsonLd } from "./_components/json-ld";
import { ThemeProvider } from "./_components/theme-provider";
import {
  SITE_DOMAIN,
  SITE_GETDESIGN_URL,
  SITE_GITHUB_URL,
  SITE_NAME,
  SITE_PARENT,
} from "./_lib/site";

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

const SITE_TITLE = `${SITE_NAME} \u00b7 open-source AI design partner`;
const SITE_DESCRIPTION =
  "getdesign Studio lets you collaborate with AI to create polished visual work\u2014designs, prototypes, slides, one-pagers, and more. Open source for macOS, Windows, and Linux; use Claude, ChatGPT, Gemini, or your own API.";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: `%s \u00b7 ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  metadataBase: new URL(SITE_DOMAIN),
  keywords: [
    "getdesign",
    "getdesign Studio",
    "Claude Design alternative",
    "open source design tool",
    "AI design partner",
    "HTML decks",
    "PPTX export",
    "BYOK",
    "Claude Pro",
    "ChatGPT Plus",
    "Codex",
    "Opencode",
    "Electron",
    "desktop app",
    "macOS",
    "Windows",
    "Linux",
  ],
  authors: [{ name: SITE_PARENT, url: SITE_GETDESIGN_URL }],
  creator: SITE_PARENT,
  publisher: SITE_PARENT,
  category: "developer-tools",
  alternates: { canonical: "/" },
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
    description: SITE_DESCRIPTION,
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
        "@type": "SoftwareApplication",
        name: `${SITE_PARENT} ${SITE_NAME}`,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "macOS, Windows, Linux",
        description: SITE_DESCRIPTION,
        url: SITE_DOMAIN,
        downloadUrl: `${SITE_GITHUB_URL}/releases/latest`,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
        <JsonLd data={jsonLd} />
      </body>
    </html>
  );
}
