"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, TrendingUp, BookOpen, Bell, Settings, Send, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ClientSwitcher } from "./ClientSwitcher"
import { useSidebar } from "@/lib/sidebar-context"

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: TrendingUp },
  { href: "/rules", label: "Rules", icon: BookOpen },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/outreach", label: "Outreach", icon: Send },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { open, setOpen } = useSidebar()

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-full w-56 bg-zinc-900 text-zinc-100 flex flex-col z-50 transition-transform duration-200",
        "md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="px-5 py-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <span className="font-bold text-lg tracking-tight">Ad Monitor</span>
            <p className="text-xs text-zinc-400 mt-0.5">Campaign Agent</p>
          </div>
          <button
            className="md:hidden text-zinc-400 hover:text-white p-1"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ClientSwitcher />
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
