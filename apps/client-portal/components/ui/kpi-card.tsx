"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AreaChart, Area, Tooltip, ResponsiveContainer,
} from "recharts"

interface ChartPoint { date: string; value: number }

interface Props {
  label: string
  value: string
  icon: React.ElementType
  iconColor?: string
  iconBg?: string
  delta?: { value: string; positive: boolean | null }
  index?: number
  chartData?: ChartPoint[]
  chartColor?: string
  chartFormatter?: (value: number | string) => string
}

export function KPICard({
  label,
  value,
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-50 dark:bg-indigo-950/50",
  delta,
  index = 0,
  chartData,
  chartColor = "#6366f1",
  chartFormatter,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const hasChart = chartData && chartData.length > 0
  const gradientId = `kpi-grad-${index}`

  // Format chart dates nicely
  const formatted = hasChart
    ? chartData.map((d) => {
        const [y, m, day] = d.date.split("-").map(Number)
        return {
          date: new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: d.value,
        }
      })
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      whileHover={!expanded ? { y: -1 } : {}}
      onClick={() => hasChart && setExpanded((v) => !v)}
      className={cn(
        "bg-card border border-border rounded-xl p-5 flex flex-col gap-4 select-none",
        hasChart && "cursor-pointer"
      )}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>

      {/* Value + delta row */}
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-foreground tracking-tight">{value}</span>
        <div className="flex items-center gap-1.5">
          {delta && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              delta.positive === true && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
              delta.positive === false && "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400",
              delta.positive === null && "bg-muted text-muted-foreground",
            )}>
              {delta.positive === true && <TrendingUp className="h-3 w-3" />}
              {delta.positive === false && <TrendingDown className="h-3 w-3" />}
              {delta.positive === null && <Minus className="h-3 w-3" />}
              {delta.value}
            </div>
          )}
          {hasChart && (
            <div className="text-muted-foreground">
              {expanded
                ? <ChevronUp className="h-3.5 w-3.5" />
                : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          )}
        </div>
      </div>

      {/* Expandable mini chart */}
      <AnimatePresence initial={false}>
        {expanded && hasChart && (
          <motion.div
            key="chart"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 88 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden -mx-1"
          >
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                    color: "hsl(var(--foreground))",
                    padding: "4px 10px",
                  }}
                  formatter={(v) => [chartFormatter ? chartFormatter(v as number) : v, ""]}
                  labelFormatter={(l) => l}
                  cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: "3 2" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={1.5}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{ r: 3, fill: chartColor, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
