"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, TrendingUp, BookOpen, Bell, X } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: TrendingUp },
  { href: "/dashboard/rules", label: "Rules", icon: BookOpen },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
]

interface Props {
  open: boolean
  onClose: () => void
  clientName: string
}

export function Sidebar({ open, onClose, clientName }: Props) {
  const pathname = usePathname()
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-56 bg-zinc-900 text-zinc-100 flex flex-col z-50 transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="px-5 py-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <span className="font-bold text-sm tracking-tight text-white">Developer&apos;s Market</span>
            <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[140px]">{clientName}</p>
          </div>
          <button className="md:hidden text-zinc-400 hover:text-white" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-800 flex items-center gap-3">
          <UserButton  />
          <span className="text-xs text-zinc-400 truncate">Account</span>
        </div>
      </aside>
    </>
  )
}
