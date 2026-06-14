"use client"

import { usePathname } from "next/navigation"
import { Menu, Search } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { ThemeToggle } from "./ThemeToggle"
import { NotificationBell } from "./NotificationBell"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/activity": "Activity",
  "/dashboard/campaigns": "Campaigns",
  "/dashboard/rules": "Rules",
  "/dashboard/projects": "Projects",
  "/dashboard/invoices": "Invoices",
  "/dashboard/support": "Support",
  "/dashboard/notifications": "Notifications",
  "/dashboard/settings": "Settings",
}

interface Props {
  onMenuClick: () => void
  alertCount?: number
}

export function TopBar({ onMenuClick, alertCount = 0 }: Props) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? "Dashboard"

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center px-4 gap-3">
      <button
        onClick={onMenuClick}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="font-semibold text-sm text-foreground">{title}</h1>

      <div className="flex-1 max-w-xs mx-auto hidden sm:flex">
        <div className="w-full relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <div className="w-full h-8 pl-8 pr-3 flex items-center text-xs text-muted-foreground bg-muted rounded-md border border-border cursor-pointer hover:border-ring/50 transition-colors select-none">
            <span>Search...</span>
            <kbd className="ml-auto font-mono text-[10px] bg-background border border-border rounded px-1 py-0.5">⌘K</kbd>
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell count={alertCount} />
        <div className="ml-1 md:hidden">
          <UserButton />
        </div>
      </div>
    </header>
  )
}
