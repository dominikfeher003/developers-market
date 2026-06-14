import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { ClientProvider } from "@/lib/client-context"
import { SidebarProvider } from "@/lib/sidebar-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ad Monitor",
  description: "Campaign Monitor Agent Dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-50 overflow-x-hidden`}>
        <ClientProvider>
          <SidebarProvider>
            <Sidebar />
            <main className="md:ml-56 min-h-screen">{children}</main>
          </SidebarProvider>
        </ClientProvider>
      </body>
    </html>
  )
}
