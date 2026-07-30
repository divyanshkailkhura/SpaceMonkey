import type React from "react"
import { ThemeProvider } from "../components/theme-provider"
import { SessionProvider } from "../components/session-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SearchProvider } from "@/components/SearchProvider"
import "@/app/globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>SpaceMonkey - Explore the Cosmos</title>
        <meta name="description" content="Modern, interactive astronomy learning platform for stargazers" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <SearchProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navbar />
                <div className="flex-1">{children}</div>
                <Footer />
              </div>
            </SearchProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
