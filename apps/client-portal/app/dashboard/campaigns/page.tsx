import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { fetchCampaigns, fetchCampaignInsights } from "@/lib/meta-api"
import { CampaignCard } from "@/components/campaigns/CampaignCard"
import { DailyInsight } from "@/lib/types"

export default async function CampaignsPage() {
  const client = await getUserClient()
  if (!client) redirect("/dashboard")

  const campaigns = await fetchCampaigns(client.metaAdAccountId, client.metaAccessToken).catch(() => [])

  const insightsResults = await Promise.allSettled(
    campaigns.map((c) => fetchCampaignInsights(c.id, client.metaAccessToken, 7))
  )

  const campaignsWithInsights = campaigns.map((c, i) => {
    const result = insightsResults[i]
    const series: DailyInsight[] = result.status === "fulfilled" ? result.value : []
    const agg = series.reduce(
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
    if (series.length > 0) agg.purchase_roas = agg.purchase_roas / series.length
    return { ...c, insights: { last7d: agg, dailySeries: series } }
  })

  const active = campaignsWithInsights.filter((c) => c.status === "ACTIVE")
  const paused = campaignsWithInsights.filter((c) => c.status !== "ACTIVE")

  return (
    <div className="p-4 md:p-6 space-y-6">
      {campaignsWithInsights.length === 0 ? (
        <div className="text-center py-24 text-zinc-400">
          <p className="font-medium">No campaigns found</p>
          <p className="text-sm mt-1">Your campaigns will appear here once they&apos;re set up.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                Active ({active.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((c) => <CampaignCard key={c.id} campaign={c} />)}
              </div>
            </div>
          )}
          {paused.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                Paused ({paused.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paused.map((c) => <CampaignCard key={c.id} campaign={c} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
