import { cn } from "@/lib/utils"

type Variant = "success" | "warning" | "danger" | "neutral" | "info" | "purple"

const VARIANTS: Record<Variant, string> = {
  success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800",
  warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800",
  danger: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800",
  neutral: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 ring-1 ring-zinc-200 dark:ring-zinc-700",
  info: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800",
  purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 ring-1 ring-purple-200 dark:ring-purple-800",
}

interface Props {
  variant?: Variant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

export function StatusBadge({ variant = "neutral", children, className, dot = false }: Props) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
      VARIANTS[variant],
      className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-emerald-500": variant === "success",
        "bg-amber-500": variant === "warning",
        "bg-red-500": variant === "danger",
        "bg-zinc-400": variant === "neutral",
        "bg-blue-500": variant === "info",
        "bg-purple-500": variant === "purple",
      })} />}
      {children}
    </span>
  )
}
