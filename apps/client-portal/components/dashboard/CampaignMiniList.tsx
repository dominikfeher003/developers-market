import { Campaign } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props { campaigns: Campaign[] }

export function CampaignMiniList({ campaigns }: Props) {
  const top = [...campaigns]
    .sort((a, b) => b.insights.last7d.purchase_roas - a.insights.last7d.purchase_roas)
    .slice(0, 5)

  if (top.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-zinc-700 mb-4">Top Campaigns by ROAS</h3>
      <div className="space-y-3">
        {top.map((c) => {
          const roas = c.insights.last7d.purchase_roas
          return (
            <div key={c.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">{c.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">${c.insights.last7d.spend.toFixed(0)} spend</p>
              </div>
              <div className="text-right shrink-0">
                <span className={cn(
                  "text-sm font-bold",
                  roas >= 3 ? "text-green-600" : roas >= 1.5 ? "text-yellow-600" : "text-red-600"
                )}>
                  {roas.toFixed(2)}x
                </span>
                <span className={cn(
                  "ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium",
                  c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                )}>
                  {c.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
