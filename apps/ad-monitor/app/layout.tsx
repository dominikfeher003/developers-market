import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { ClientProvider } from "@/lib/client-context"
import { SidebarProvider } from "@/lib/sidebar-context"
import { ToastProvider } from "@/lib/toast"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ad Monitor",
  description: "Campaign Monitor Agent Dashboard",
}

const themeScript = `(function(){try{var t=localStorage.getItem('monitor-theme')||'light';if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} bg-background overflow-x-hidden`}>
        <ToastProvider>
          <ClientProvider>
            <SidebarProvider>
              <Sidebar />
              <main className="md:ml-56 min-h-screen">{children}</main>
            </SidebarProvider>
          </ClientProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
