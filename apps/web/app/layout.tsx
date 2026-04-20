import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "getdesign — on-demand design systems from any URL",
  description:
    "Paste a URL. Get a production-grade design.md with palette, typography, components, and more — grounded in the real site's CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
