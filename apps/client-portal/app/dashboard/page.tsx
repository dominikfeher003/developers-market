import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { fetchCampaigns, fetchCampaignInsights, fetchAccountInfo } from "@/lib/meta-api"
import { readAlerts, readRules } from "@/lib/storage"
import { StatsGrid } from "@/components/dashboard/StatsGrid"
import { SpendChart } from "@/components/dashboard/SpendChart"
import { CampaignMiniList } from "@/components/dashboard/CampaignMiniList"
import { AlertItem } from "@/components/notifications/AlertItem"
import { greeting } from "@/lib/utils"
import { DailyInsight } from "@/lib/types"

export default async function DashboardPage() {
  const client = await getUserClient()
  if (!client) redirect("/dashboard")

  const [campaigns, accountInfo, allAlerts, allRules] = await Promise.all([
    fetchCampaigns(client.metaAdAccountId, client.metaAccessToken).catch(() => []),
    fetchAccountInfo(client.metaAdAccountId, client.metaAccessToken),
    readAlerts(),
    readRules(),
  ])

  // Fetch insights for all campaigns in parallel (30d for chart)
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

  // Build combined daily series for chart
  const dateMap: Record<string, DailyInsight> = {}
  for (const c of campaignsWithInsights) {
    for (const d of c.insights.dailySeries) {
      if (dateMap[d.date]) dateMap[d.date].spend += d.spend
      else dateMap[d.date] = { ...d }
    }
  }
  const chartData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date))

  const clientAlerts = allAlerts
    .filter((a) => allRules.some((r) => r.id === a.ruleId && r.clientId === client.id))
    .slice(0, 5)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">{greeting()}, {client.name}</h2>
        <p className="text-zinc-500 text-sm mt-1">Here&apos;s how your campaigns are performing.</p>
      </div>

      <StatsGrid campaigns={campaignsWithInsights} accountInfo={accountInfo} />

      {chartData.length > 0 && <SpendChart data={chartData} />}

      <div className="grid md:grid-cols-2 gap-6">
        <CampaignMiniList campaigns={campaignsWithInsights} />

        {clientAlerts.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">Recent Notifications</h3>
            <div>
              {clientAlerts.map((a) => (
                <AlertItem key={a.id} alert={a} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
