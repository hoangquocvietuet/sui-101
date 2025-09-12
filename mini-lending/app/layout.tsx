import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import "./globals.css"
import "@mysten/dapp-kit/dist/index.css"
import { SuiProvider } from "@/components/sui-provider"

export const metadata: Metadata = {
  title: "Sui Mini Lending Market",
  description: "A simplified lending and borrowing platform for Sui assets",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SuiProvider>
              {children}
            </SuiProvider>
            <Toaster />
          </ThemeProvider>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
