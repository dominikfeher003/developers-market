import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { fetchCampaigns, fetchCampaignInsights } from "@/lib/meta-api"
import { fetchTikTokCampaigns, fetchTikTokInsights } from "@/lib/tiktok-api"
import { Campaign, DailyInsight } from "@/lib/types"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { TrendingUp } from "lucide-react"

function PlatformBadge({ platform }: { platform?: "meta" | "tiktok" }) {
  if (platform === "tiktok") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded">
        TikTok
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded">
      Meta · FB + IG
    </span>
  )
}

async function buildCampaignData(campaigns: Campaign[], token: string, isTikTok: boolean, advertiserId?: string) {
  const insightsResults = await Promise.allSettled(
    campaigns.map((c) =>
      isTikTok
        ? fetchTikTokInsights(c.id, advertiserId!, token, 7)
        : fetchCampaignInsights(c.id, token, 7)
    )
  )
  return campaigns.map((c, i) => {
    const result = insightsResults[i]
    const series: DailyInsight[] = result.status === "fulfilled" ? result.value : []
    const agg = series.reduce(
      (acc, d) => ({ ...acc, spend: acc.spend + d.spend, purchase_roas: acc.purchase_roas + d.purchase_roas, impressions: acc.impressions + d.impressions, clicks: acc.clicks + d.clicks }),
      { spend: 0, purchase_roas: 0, impressions: 0, clicks: 0 }
    )
    if (series.length > 0) agg.purchase_roas = agg.purchase_roas / series.length
    const budgetPct = c.daily_budget && agg.spend > 0 ? Math.min(100, (agg.spend / 7 / c.daily_budget) * 100) : null
    return { ...c, agg, budgetPct }
  })
}

export default async function CampaignsPage() {
  const client = await getUserClient()
  if (!client) redirect("/dashboard")

  const [metaRaw, tiktokRaw] = await Promise.all([
    fetchCampaigns(client.metaAdAccountId, client.metaAccessToken).catch(() => [] as Campaign[]),
    client.tiktokAdAccountId && client.tiktokAccessToken
      ? fetchTikTokCampaigns(client.tiktokAdAccountId, client.tiktokAccessToken).catch(() => [] as Campaign[])
      : Promise.resolve([] as Campaign[]),
  ])

  const metaCampaigns = metaRaw.map((c) => ({ ...c, platform: "meta" as const }))

  const [metaData, tiktokData] = await Promise.all([
    buildCampaignData(metaCampaigns, client.metaAccessToken, false),
    client.tiktokAdAccountId && client.tiktokAccessToken
      ? buildCampaignData(tiktokRaw, client.tiktokAccessToken, true, client.tiktokAdAccountId)
      : Promise.resolve([]),
  ])

  const data = [...metaData, ...tiktokData]

  const active = data.filter((c) => c.status === "ACTIVE")
  const paused = data.filter((c) => c.status !== "ACTIVE")

  if (data.length === 0) {
    return <EmptyState icon={TrendingUp} title="No campaigns found" description="Your ad campaigns will appear here once they're set up." />
  }

  type CampaignRow = typeof data[0]

  function CampaignRow({ c }: { c: CampaignRow }) {
    const roas = c.agg.purchase_roas
    return (
      <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
        <td className="py-3.5 px-4">
          <div className="flex items-center gap-2">
            <PlatformBadge platform={c.platform} />
            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{c.name}</p>
          </div>
        </td>
        <td className="py-3.5 px-4">
          <StatusBadge variant={c.status === "ACTIVE" ? "success" : "neutral"} dot>
            {c.status === "ACTIVE" ? "Active" : "Paused"}
          </StatusBadge>
        </td>
        <td className="py-3.5 px-4 tabular-nums text-sm text-foreground text-right">
          ${c.agg.spend.toFixed(0)}
        </td>
        <td className="py-3.5 px-4 text-right">
          <span className={cn(
            "text-sm font-semibold tabular-nums",
            roas >= 3 ? "text-emerald-600 dark:text-emerald-400" : roas >= 1.5 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
          )}>
            {roas.toFixed(2)}x
          </span>
        </td>
        <td className="py-3.5 px-4 text-right text-sm text-muted-foreground tabular-nums">
          {c.agg.impressions.toLocaleString()}
        </td>
        <td className="py-3.5 px-4 min-w-[120px]">
          {c.budgetPct !== null ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", c.budgetPct >= 90 ? "bg-red-500" : c.platform === "tiktok" ? "bg-black dark:bg-white" : "bg-indigo-500")} style={{ width: `${c.budgetPct}%` }} />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{c.budgetPct.toFixed(0)}%</span>
            </div>
          ) : <span className="text-xs text-muted-foreground">—</span>}
        </td>
      </tr>
    )
  }

  function CampaignTable({ items, label }: { items: CampaignRow[]; label: string }) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <span className="text-xs text-muted-foreground">{items.length} campaign{items.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Campaign", "Status", "Spend (7d)", "ROAS", "Impressions", "Daily Budget"].map((h, i) => (
                  <th key={h} className={cn("py-2.5 px-4 text-xs font-medium text-muted-foreground", i > 1 && i < 5 ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((c) => <CampaignRow key={c.id} c={c} />)}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const hasTikTok = tiktokData.length > 0
  const platformSummary = hasTikTok
    ? `${metaData.length} Meta · ${tiktokData.length} TikTok`
    : `${data.length} campaigns`

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Campaigns</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{platformSummary} · 7-day performance</p>
      </div>

      {hasTikTok && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Platforms active:</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-1 rounded">
              Meta · FB + IG
            </span>
            <span className="inline-flex items-center text-xs font-semibold bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded">
              TikTok
            </span>
          </div>
        </div>
      )}

      {active.length > 0 && <CampaignTable items={active} label="Active" />}
      {paused.length > 0 && <CampaignTable items={paused} label="Paused" />}
    </div>
  )
}
