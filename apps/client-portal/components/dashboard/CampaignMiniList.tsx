import { Campaign } from "@/lib/types"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"

interface Props { campaigns: Campaign[] }

export function CampaignMiniList({ campaigns }: Props) {
  const top = [...campaigns]
    .sort((a, b) => b.insights.last7d.purchase_roas - a.insights.last7d.purchase_roas)
    .slice(0, 5)

  if (top.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Top Campaigns by ROAS</h3>
      <div className="space-y-3">
        {top.map((c) => {
          const roas = c.insights.last7d.purchase_roas
          return (
            <div key={c.id} className="flex items-center gap-3 group">
              <div className="w-1.5 h-8 rounded-full shrink-0" style={{
                background: roas >= 3 ? "#10b981" : roas >= 1.5 ? "#f59e0b" : "#ef4444",
                opacity: 0.7,
              }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">${c.insights.last7d.spend.toFixed(0)} spend · 7d</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge variant={c.status === "ACTIVE" ? "success" : "neutral"} dot>
                  {c.status}
                </StatusBadge>
                <span className={cn(
                  "text-sm font-bold tabular-nums",
                  roas >= 3 ? "text-emerald-600 dark:text-emerald-400" : roas >= 1.5 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                )}>
                  {roas.toFixed(2)}x
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
