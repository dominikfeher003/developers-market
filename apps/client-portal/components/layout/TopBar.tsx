"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/campaigns": "Campaigns",
  "/dashboard/rules": "Rules",
  "/dashboard/notifications": "Notifications",
}

interface Props { onMenuClick: () => void }

export function TopBar({ onMenuClick }: Props) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? "Dashboard"
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-zinc-200 bg-white">
      <div className="flex items-center gap-3">
        <button className="md:hidden text-zinc-500 hover:text-zinc-900" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
      </div>
      <div className="md:hidden">
        <UserButton  />
      </div>
    </header>
  )
}
