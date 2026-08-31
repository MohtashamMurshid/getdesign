import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components"

import "@radix-ui/themes/styles.css"
import "@workos-inc/widgets/base.css"
import "@workos-inc/widgets/styles.css"
import "./globals.css"
import { DashboardConvexProvider } from "@/components/convex-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  applicationName: "getdesign",
  appleWebApp: { title: "getdesign", capable: false },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <AuthKitProvider>
          <DashboardConvexProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </DashboardConvexProvider>
        </AuthKitProvider>
      </body>
    </html>
  )
}
