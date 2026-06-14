import { NextRequest, NextResponse } from "next/server"
import { readSettings, readJSON, writeJSON, readClients } from "@/lib/storage"
import { fetchCampaigns, fetchCampaignInsights } from "@/lib/meta-api"
import { fetchTikTokCampaigns, fetchTikTokInsights } from "@/lib/tiktok-api"
import { Campaign, DailyInsight } from "@/lib/types"

interface CacheData {
  fetchedAt: string | null
  campaigns: Campaign[]
}

const CACHE_TTL_MS = 15 * 60 * 1000

function aggregateInsights(series: DailyInsight[]): Omit<DailyInsight, "date"> {
  const n = series.length
  return {
    spend: series.reduce((s, d) => s + d.spend, 0),
    purchase_roas: series.reduce((s, d) => s + d.purchase_roas, 0) / n,
    impressions: series.reduce((s, d) => s + d.impressions, 0),
    clicks: series.reduce((s, d) => s + d.clicks, 0),
    ctr: series.reduce((s, d) => s + d.ctr, 0) / n,
    reach: series.reduce((s, d) => s + (d.reach ?? 0), 0),
    frequency: series.reduce((s, d) => s + (d.frequency ?? 0), 0) / n,
    video_views: series.reduce((s, d) => s + (d.video_views ?? 0), 0),
    video_view_rate: series.reduce((s, d) => s + (d.video_view_rate ?? 0), 0) / n,
    engagement_rate: series.reduce((s, d) => s + (d.engagement_rate ?? 0), 0) / n,
    cost_per_engagement: series.reduce((s, d) => s + (d.cost_per_engagement ?? 0), 0) / n,
    post_likes: series.reduce((s, d) => s + (d.post_likes ?? 0), 0),
    post_comments: series.reduce((s, d) => s + (d.post_comments ?? 0), 0),
    post_shares: series.reduce((s, d) => s + (d.post_shares ?? 0), 0),
  }
}

async function enrichMeta(campaigns: Campaign[], token: string) {
  for (const campaign of campaigns) {
    try {
      const series = await fetchCampaignInsights(campaign.id, token, 7)
      campaign.insights.dailySeries = series
      if (series.length > 0) campaign.insights.last7d = aggregateInsights(series)
    } catch { /* non-fatal */ }
  }
}

async function enrichTikTok(campaigns: Campaign[], advertiserId: string, token: string) {
  for (const campaign of campaigns) {
    try {
      const series = await fetchTikTokInsights(campaign.id, advertiserId, token, 7)
      campaign.insights.dailySeries = series
      if (series.length > 0) campaign.insights.last7d = aggregateInsights(series)
    } catch { /* non-fatal */ }
  }
}

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1"
  const clientId = req.nextUrl.searchParams.get("clientId")

  const cacheKey = clientId ? `cache-${clientId}.json` : "cache.json"
  const cache = await readJSON<CacheData>(cacheKey)

  const age = cache.fetchedAt ? Date.now() - new Date(cache.fetchedAt).getTime() : Infinity
  if (!force && age < CACHE_TTL_MS && cache.campaigns.length > 0) {
    return NextResponse.json({ campaigns: cache.campaigns, fetchedAt: cache.fetchedAt, fromCache: true })
  }

  let metaAccountId: string
  let metaToken: string
  let tiktokAccountId: string | undefined
  let tiktokToken: string | undefined

  if (clientId) {
    const clients = await readClients()
    const client = clients.find((c) => c.id === clientId)
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
    metaAccountId = client.metaAdAccountId
    metaToken = client.metaAccessToken
    tiktokAccountId = client.tiktokAdAccountId
    tiktokToken = client.tiktokAccessToken
  } else {
    const settings = await readSettings()
    if (!settings.metaAdAccountId || !settings.metaAccessToken) {
      return NextResponse.json({ error: "Meta credentials not configured" }, { status: 400 })
    }
    metaAccountId = settings.metaAdAccountId
    metaToken = settings.metaAccessToken
  }

  try {
    const [metaCampaigns, tiktokCampaigns] = await Promise.all([
      fetchCampaigns(metaAccountId, metaToken).then((cs) =>
        cs.map((c) => ({ ...c, platform: "meta" as const }))
      ),
      tiktokAccountId && tiktokToken
        ? fetchTikTokCampaigns(tiktokAccountId, tiktokToken)
        : Promise.resolve([] as Campaign[]),
    ])

    await Promise.all([
      enrichMeta(metaCampaigns, metaToken),
      tiktokAccountId && tiktokToken
        ? enrichTikTok(tiktokCampaigns, tiktokAccountId, tiktokToken)
        : Promise.resolve(),
    ])

    const campaigns = [...metaCampaigns, ...tiktokCampaigns]
    const fetchedAt = new Date().toISOString()
    await writeJSON(cacheKey, { fetchedAt, campaigns })
    return NextResponse.json({ campaigns, fetchedAt, fromCache: false })
  } catch (err) {
    const isDev = process.env.NODE_ENV === "development"
    return NextResponse.json({ error: isDev ? String(err) : "Internal server error" }, { status: 500 })
  }
}
