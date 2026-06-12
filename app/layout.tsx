import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Developer's Market — AI-Powered Ads & Website Management",
  description: "We manage Facebook, Instagram, and TikTok campaigns for growing businesses — with an AI agent that optimises 24/7.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#08080a] text-zinc-100 antialiased`}>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
