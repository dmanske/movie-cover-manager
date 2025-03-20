import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ApiKeySetup } from "@/components/api-key-setup"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Movie Cover Manager",
  description: "Gerenciador de capas de filmes e séries",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ApiKeySetup />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'