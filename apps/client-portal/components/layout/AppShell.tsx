"use client"

import { useState } from "react"
import { Client } from "@/lib/types"
import { ClientContext } from "@/lib/client-context"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"

interface Props {
  client: Client
  children: React.ReactNode
}

export function AppShell({ client, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <ClientContext.Provider value={client}>
      <div className="min-h-screen bg-zinc-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} clientName={client.name} />
        <div className="md:ml-56 flex flex-col min-h-screen">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </ClientContext.Provider>
  )
}
