import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { fetchCampaigns, fetchCampaignInsights, fetchAccountInfo } from "@/lib/meta-api"
import { readAlerts, readRules } from "@/lib/storage"
import { StatsGrid } from "@/components/dashboard/StatsGrid"
import { SpendChart } from "@/components/dashboard/SpendChart"
import { CampaignMiniList } from "@/components/dashboard/CampaignMiniList"
import { BudgetPacing } from "@/components/dashboard/BudgetPacing"
import { Greeting } from "@/components/dashboard/Greeting"
import { DailyInsight } from "@/lib/types"
import { timeAgo } from "@/lib/utils"
import { Zap, TrendingUp, PauseCircle, RotateCcw } from "lucide-react"
import { getDb, campaignSnapshots, eq, gte } from "@dm/db"
import { getPortalT } from "@/lib/i18n/server"

const ACTION_ICONS = {
  pause: PauseCircle,
  resume: RotateCcw,
  scale_budget: TrendingUp,
  notify_only: Zap,
} as const

const ACTION_COLORS = {
  pause: "text-red-500",
  resume: "text-emerald-500",
  scale_budget: "text-blue-500",
  notify_only: "text-indigo-500",
} as const

export default async function DashboardPage() {
  const [client, t] = await Promise.all([getUserClient(), getPortalT()])
  if (!client) redirect("/")

  // Budget pacing: query this month's snapshots
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()

  const [campaigns, accountInfo, allAlerts, allRules, monthlySnaps] = await Promise.all([
    fetchCampaigns(client.metaAdAccountId, client.metaAccessToken).catch(() => []),
    fetchAccountInfo(client.metaAdAccountId, client.metaAccessToken),
    readAlerts(),
    readRules(),
    getDb()
      .select({ date: campaignSnapshots.date, spend: campaignSnapshots.spend, dailyBudget: campaignSnapshots.dailyBudget })
      .from(campaignSnapshots)
      .where(eq(campaignSnapshots.clientId, client.id))
      .then((rows) => rows.filter((r) => r.date >= firstOfMonth))
      .catch(() => [] as { date: string; spend: number; dailyBudget: number }[]),
  ])

  // Aggregate daily spend for this month
  const dailySpendMap: Record<string, number> = {}
  for (const s of monthlySnaps) {
    dailySpendMap[s.date] = (dailySpendMap[s.date] ?? 0) + s.spend
  }
  // Estimate monthly budget: most recent day's total daily budget × days in month
  const latestDate = monthlySnaps.reduce((max, s) => (s.date > max ? s.date : max), "")
  const latestDayBudget = monthlySnaps.filter((s) => s.date === latestDate).reduce((sum, s) => sum + s.dailyBudget, 0)
  const estimatedMonthlyBudget = latestDayBudget * daysInMonth

  const dailySpend = Object.entries(dailySpendMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, spend]) => ({ date, spend }))

  const insightsResults = await Promise.allSettled(
    campaigns.map((c) => fetchCampaignInsights(c.id, client.metaAccessToken, 30))
  )
  const campaignsWithInsights = campaigns.map((c, i) => {
    const result = insightsResults[i]
    const series: DailyInsight[] = result.status === "fulfilled" ? result.value : []
    const last7 = series.slice(-7)
    const agg = last7.reduce(
      (acc, d) => ({
        spend: acc.spend + d.spend,
        purchase_roas: acc.purchase_roas + d.purchase_roas,
        impressions: acc.impressions + d.impressions,
        clicks: acc.clicks + d.clicks,
        ctr: acc.ctr + d.ctr,
        reach: acc.reach + d.reach,
        frequency: acc.frequency + d.frequency,
        video_views: acc.video_views + d.video_views,
        video_view_rate: acc.video_view_rate + d.video_view_rate,
        engagement_rate: acc.engagement_rate + d.engagement_rate,
        cost_per_engagement: acc.cost_per_engagement + d.cost_per_engagement,
        post_likes: acc.post_likes + d.post_likes,
        post_comments: acc.post_comments + d.post_comments,
        post_shares: acc.post_shares + d.post_shares,
      }),
      { spend: 0, purchase_roas: 0, impressions: 0, clicks: 0, ctr: 0, reach: 0, frequency: 0, video_views: 0, video_view_rate: 0, engagement_rate: 0, cost_per_engagement: 0, post_likes: 0, post_comments: 0, post_shares: 0 }
    )
    if (last7.length > 0) agg.purchase_roas = agg.purchase_roas / last7.length
    return { ...c, insights: { last7d: agg, dailySeries: series } }
  })

  const dateMap: Record<string, DailyInsight & { roasCount: number }> = {}
  for (const c of campaignsWithInsights) {
    for (const d of c.insights.dailySeries) {
      if (dateMap[d.date]) {
        dateMap[d.date].spend += d.spend
        dateMap[d.date].impressions += d.impressions
        dateMap[d.date].purchase_roas += d.purchase_roas
        dateMap[d.date].roasCount += 1
      } else {
        dateMap[d.date] = { ...d, roasCount: 1 }
      }
    }
  }
  const sortedDates = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date))
  const chartData = sortedDates

  // Per-metric daily series for KPI card drill-downs
  const spendSeries = sortedDates.map((d) => ({ date: d.date, value: d.spend }))
  const roasSeries = sortedDates.map((d) => ({ date: d.date, value: d.roasCount > 0 ? d.purchase_roas / d.roasCount : 0 }))
  const impressionsSeries = sortedDates.map((d) => ({ date: d.date, value: d.impressions }))
  const metricSeries = { spend: spendSeries, roas: roasSeries, impressions: impressionsSeries }

  const clientAlerts = allAlerts
    .filter((a) => allRules.some((r) => r.id === a.ruleId && r.clientId === client.id))
    .slice(0, 5)

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <Greeting name={client.name.split(" ")[0]} />
        <p className="text-sm text-muted-foreground mt-0.5">{today} · {t.dashboard.campaignsPerforming}</p>
      </div>

      <StatsGrid campaigns={campaignsWithInsights} accountInfo={accountInfo} metricSeries={metricSeries} />

      {chartData.length > 0 && <SpendChart data={chartData} />}

      <BudgetPacing
        dailySpend={dailySpend}
        estimatedMonthlyBudget={estimatedMonthlyBudget}
        daysInMonth={daysInMonth}
        dayOfMonth={dayOfMonth}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <CampaignMiniList campaigns={campaignsWithInsights} />

        {clientAlerts.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">{t.dashboard.recentActivity}</h3>
            <div className="space-y-3">
              {clientAlerts.map((a) => {
                const Icon = ACTION_ICONS[a.action] ?? Zap
                const color = ACTION_COLORS[a.action] ?? "text-indigo-500"
                return (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        <span className="font-medium">{a.action.replace("_", " ")}</span>
                        {" · "}<span className="text-muted-foreground truncate">{a.campaignName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(a.timestamp)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
