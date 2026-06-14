"use client"

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface DailySpend {
  date: string
  spend: number
}

interface BudgetPacingProps {
  dailySpend: DailySpend[]
  estimatedMonthlyBudget: number
  daysInMonth: number
  dayOfMonth: number
}

function fmt(n: number) {
  return "$" + n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function BudgetPacing({ dailySpend, estimatedMonthlyBudget, daysInMonth, dayOfMonth }: BudgetPacingProps) {
  if (dailySpend.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Budget Pacing</h3>
        <p className="text-xs text-muted-foreground">No data yet — budget tracking starts after the first agent run.</p>
      </div>
    )
  }

  const currentSpend = dailySpend.reduce((s, d) => s + d.spend, 0)
  const avgDaily = dailySpend.length > 0 ? currentSpend / dailySpend.length : 0
  const projected = avgDaily * daysInMonth
  const budget = estimatedMonthlyBudget > 0 ? estimatedMonthlyBudget : projected * 1.1

  const pct = budget > 0 ? Math.min((currentSpend / budget) * 100, 100) : 0
  const projectedPct = budget > 0 ? (projected / budget) * 100 : 100

  // Color: green ≤ 105%, amber ≤ 120%, red > 120%
  const barColor = projectedPct > 120 ? "#ef4444" : projectedPct > 105 ? "#f59e0b" : "#10b981"
  const textColor = projectedPct > 120 ? "text-red-500" : projectedPct > 105 ? "text-amber-500" : "text-emerald-500"

  const chartData = dailySpend.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    spend: d.spend,
  }))

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Budget Pacing</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Day {dayOfMonth} of {daysInMonth}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">{fmt(currentSpend)}</p>
          <p className="text-xs text-muted-foreground">of ~{fmt(budget)} est.</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{pct.toFixed(0)}% spent</span>
          <span className={`font-medium ${textColor}`}>
            Projected: {fmt(projected)}{" "}
            {projectedPct > 110 ? "over budget" : projectedPct < 90 ? "under pace" : "on track"}
          </span>
        </div>
      </div>

      {/* Daily spend bars */}
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <Tooltip
              formatter={(v) => [fmt(Number(v)), "Spend"]}
              contentStyle={{ fontSize: 11, borderRadius: 6, padding: "4px 8px" }}
              labelStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="spend" radius={[2, 2, 0, 0]}>
              {chartData.map((_entry, idx) => (
                <Cell key={idx} fill={barColor} opacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground">{fmt(avgDaily)}/day average burn rate</p>
    </div>
  )
}
