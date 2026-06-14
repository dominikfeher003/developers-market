"use client"

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { DailyInsight } from "@/lib/types"

interface Props { data: DailyInsight[] }

export function SpendChart({ data }: Props) {
  const formatted = data.map((d) => {
    const [y, m, day] = d.date.split("-").map(Number)
    const label = new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    return { date: label, spend: Math.round(d.spend * 100) / 100 }
  })

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Spend Overview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Daily ad spend — last 30 days</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.06} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
              color: "hsl(var(--foreground))",
            }}
            formatter={(v) => [`$${Number(v).toFixed(2)}`, "Spend"]}
            cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 2" }}
          />
          <Area
            type="monotone"
            dataKey="spend"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#spendGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
