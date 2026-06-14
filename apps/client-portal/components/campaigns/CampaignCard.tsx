import { Campaign } from "@/lib/types"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface Props { campaign: Campaign }

export function CampaignCard({ campaign: c }: Props) {
  const roas = c.insights.last7d.purchase_roas
  const spend = c.insights.last7d.spend
  const budget = c.daily_budget ? c.daily_budget / 100 : null
  const spendPct = budget && budget > 0 ? Math.min((spend / (budget * 7)) * 100, 100) : null

  const roasColor = roas >= 3 ? "text-green-600" : roas >= 1.5 ? "text-yellow-600" : "text-red-600"
  const RoasIcon = roas >= 3 ? TrendingUp : roas >= 1.5 ? Minus : TrendingDown

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-4">
        <h3 className="text-sm font-semibold text-zinc-800 leading-tight line-clamp-2">{c.name}</h3>
        <span className={cn(
          "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
          c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
        )}>
          {c.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-zinc-400 mb-0.5">ROAS (7d)</p>
          <div className="flex items-center gap-1">
            <RoasIcon className={cn("h-3.5 w-3.5", roasColor)} />
            <span className={cn("text-lg font-bold", roasColor)}>{roas.toFixed(2)}x</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-0.5">Spend (7d)</p>
          <p className="text-lg font-bold text-zinc-800">${spend.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-0.5">Impressions</p>
          <p className="text-sm font-semibold text-zinc-700">{c.insights.last7d.impressions.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-0.5">Clicks</p>
          <p className="text-sm font-semibold text-zinc-700">{c.insights.last7d.clicks.toLocaleString()}</p>
        </div>
      </div>

      {budget !== null && (
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Daily budget</span>
            <span>${budget.toFixed(0)}/day</span>
          </div>
          {spendPct !== null && (
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", spendPct > 90 ? "bg-red-400" : "bg-indigo-500")}
                style={{ width: `${spendPct}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
