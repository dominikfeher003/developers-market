"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, TrendingUp, BookOpen, Bell, X, FolderOpen,
  Receipt, LifeBuoy, Settings, Activity, ChevronLeft, ChevronRight,
  Zap, Megaphone, Globe,
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { usePortalI18n, PORTAL_LOCALES } from "@/lib/i18n/context"

function LangSwitcher({ collapsed }: { collapsed: boolean }) {
  const { locale, setLocale, t: _ } = usePortalI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = PORTAL_LOCALES.find(l => l.code === locale)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title={collapsed ? current?.label : undefined}
        className={cn(
          "flex items-center gap-2 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors",
          collapsed ? "justify-center w-10 py-2.5 mx-auto" : "px-3 py-2 w-full"
        )}
      >
        <Globe className="h-3.5 w-3.5 shrink-0" />
        {!collapsed && (
          <>
            <span>{current?.flag}</span>
            <span>{current?.label}</span>
          </>
        )}
        {collapsed && <span className="text-base leading-none">{current?.flag}</span>}
      </button>

      {open && (
        <div className={cn(
          "absolute bottom-full mb-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50 w-40",
          collapsed ? "left-full ml-2" : "left-0"
        )}>
          {PORTAL_LOCALES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false) }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors",
                locale === l.code
                  ? "bg-indigo-600/20 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              )}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  collapsed: boolean
  onCollapse: (v: boolean) => void
  clientName: string
}

function NavItem({
  href, label, icon: Icon, exact = false, collapsed, onClick,
}: {
  href: string; label: string; icon: React.ElementType; exact?: boolean; collapsed: boolean; onClick?: () => void
}) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md text-sm font-medium transition-colors duration-150 group relative",
        collapsed ? "justify-center px-0 py-2.5 mx-auto w-10" : "px-3 py-2",
        active
          ? "bg-indigo-600 text-white"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      )}
    >
      <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2.5 px-2 py-1 bg-zinc-800 text-zinc-100 text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          {label}
        </div>
      )}
    </Link>
  )
}

export function Sidebar({ open, onClose, collapsed, onCollapse, clientName }: Props) {
  const { t } = usePortalI18n()

  const NAV_GROUPS = [
    {
      label: t.groups.overview,
      items: [
        { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard, exact: true },
        { href: "/dashboard/activity", label: t.nav.activity, icon: Activity },
      ],
    },
    {
      label: t.groups.adManagement,
      items: [
        { href: "/dashboard/campaigns", label: t.nav.campaigns, icon: TrendingUp },
        { href: "/dashboard/rules", label: t.nav.rules, icon: Zap },
      ],
    },
    {
      label: t.groups.growth,
      items: [
        { href: "/dashboard/outreach", label: t.nav.outreach, icon: Megaphone },
      ],
    },
    {
      label: t.groups.business,
      items: [
        { href: "/dashboard/projects", label: t.nav.projects, icon: FolderOpen },
        { href: "/dashboard/invoices", label: t.nav.invoices, icon: Receipt },
      ],
    },
    {
      label: t.groups.help,
      items: [
        { href: "/dashboard/support", label: t.nav.support, icon: LifeBuoy },
      ],
    },
  ]

  const BOTTOM_ITEMS = [
    { href: "/dashboard/notifications", label: t.nav.notifications, icon: Bell },
    { href: "/dashboard/settings", label: t.nav.settings, icon: Settings },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className={cn(
          "fixed left-0 top-0 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col z-50",
          "transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-zinc-800 h-14 shrink-0",
          collapsed ? "justify-center px-3" : "px-4 gap-3"
        )}>
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">DM</span>
          </div>
          {!collapsed && (
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <p className="text-white text-sm font-semibold leading-none truncate">Developer&apos;s Market</p>
              <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-[140px]">{clientName}</p>
            </motion.div>
          )}
          <button
            className="md:hidden ml-auto text-zinc-500 hover:text-zinc-200 transition-colors"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 overflow-y-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", collapsed ? "px-1.5" : "px-3")}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 mb-1.5">
                  {group.label}
                </p>
              )}
              <div className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    {...item}
                    collapsed={collapsed}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom items */}
        <div className={cn("border-t border-zinc-800 py-3", collapsed ? "px-1.5" : "px-3")}>
          <div className={cn("space-y-0.5 mb-3", collapsed && "flex flex-col items-center")}>
            {BOTTOM_ITEMS.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                collapsed={collapsed}
                onClick={onClose}
              />
            ))}
          </div>

          <LangSwitcher collapsed={collapsed} />

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => onCollapse(!collapsed)}
            className="hidden md:flex items-center justify-center w-full py-1.5 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-colors text-xs gap-1.5"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            {!collapsed && <span>{t.nav.collapse}</span>}
          </button>

          {/* Brand block — replaces "Account" label */}
          <div className={cn(
            "flex items-center pt-3 mt-1 border-t border-zinc-800",
            collapsed ? "justify-center" : "gap-2.5 px-1"
          )}>
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">DM</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold leading-none truncate">Developers Market</p>
                <p className="text-zinc-500 text-[10px] mt-0.5 truncate">{clientName}</p>
              </div>
            )}
            <UserButton />
          </div>
        </div>
      </motion.aside>
    </>
  )
}
