"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"

export function NotificationBell({ count = 0, className }: { count?: number; className?: string }) {
  return (
    <Link
      href="/dashboard/notifications"
      className={cn(
        "relative w-8 h-8 flex items-center justify-center rounded-md",
        "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
        "hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150",
        className
      )}
      aria-label="Notifications"
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
      )}
    </Link>
  )
}
