import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "getdesign — on-demand design systems from any URL",
  description:
    "Paste a URL. An agent opens it in a real browser, extracts tokens and components, and returns a production-grade design.md. Web, API, CLI, and TypeScript SDK. Coming soon.",
  metadataBase: new URL("https://getdesign.app"),
  openGraph: {
    title: "getdesign — on-demand design systems from any URL",
    description:
      "Four surfaces, one agent. Web, API, CLI, and TypeScript SDK. Coming soon.",
    url: "https://getdesign.app",
    siteName: "getdesign",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "getdesign — coming soon",
    description:
      "On-demand design systems from any URL. Four surfaces, one agent.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrains.variable}>
      <body>{children}</body>
    </html>
  );
}
