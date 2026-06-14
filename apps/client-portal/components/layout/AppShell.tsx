"use client"

import { useState, useEffect } from "react"
import { Client } from "@/lib/types"
import { ClientContext } from "@/lib/client-context"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"

interface Props {
  client: Client
  children: React.ReactNode
  alertCount?: number
}

export function AppShell({ client, children, alertCount = 0 }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved === "true") setCollapsed(true)
    setMounted(true)
  }, [])

  function handleCollapse(v: boolean) {
    setCollapsed(v)
    localStorage.setItem("sidebar-collapsed", String(v))
  }

  const sidebarWidth = collapsed ? 64 : 240

  return (
    <ClientContext.Provider value={client}>
      <div className="min-h-screen bg-background">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onCollapse={handleCollapse}
          clientName={client.name}
        />
        <div
          className="flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out"
          style={{ marginLeft: mounted ? `${sidebarWidth}px` : "240px" }}
        >
          <TopBar onMenuClick={() => setSidebarOpen(true)} alertCount={alertCount} />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ClientContext.Provider>
  )
}
