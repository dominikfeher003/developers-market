import { NextRequest, NextResponse } from "next/server"
import { readSettings, readJSON, writeJSON, readClients } from "@/lib/storage"
import { fetchCampaigns, fetchCampaignInsights } from "@/lib/meta-api"
import { Campaign } from "@/lib/types"

interface CacheData {
  fetchedAt: string | null
  campaigns: Campaign[]
}

const CACHE_TTL_MS = 15 * 60 * 1000

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1"
  const clientId = req.nextUrl.searchParams.get("clientId")

  const cacheKey = clientId ? `cache-${clientId}.json` : "cache.json"
  const cache = await readJSON<CacheData>(cacheKey)

  const age = cache.fetchedAt ? Date.now() - new Date(cache.fetchedAt).getTime() : Infinity
  if (!force && age < CACHE_TTL_MS && cache.campaigns.length > 0) {
    return NextResponse.json({ campaigns: cache.campaigns, fetchedAt: cache.fetchedAt, fromCache: true })
  }

  let accountId: string
  let token: string

  if (clientId) {
    const clients = await readClients()
    const client = clients.find((c) => c.id === clientId)
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
    accountId = client.metaAdAccountId
    token = client.metaAccessToken
  } else {
    const settings = await readSettings()
    if (!settings.metaAdAccountId || !settings.metaAccessToken) {
      return NextResponse.json({ error: "Meta credentials not configured" }, { status: 400 })
    }
    accountId = settings.metaAdAccountId
    token = settings.metaAccessToken
  }

  try {
    const campaigns = await fetchCampaigns(accountId, token)
    for (const campaign of campaigns) {
      try {
        const dailySeries = await fetchCampaignInsights(campaign.id, token, 7)
        campaign.insights.dailySeries = dailySeries
        if (dailySeries.length > 0) {
          const n = dailySeries.length
          campaign.insights.last7d = {
            spend: dailySeries.reduce((s, d) => s + d.spend, 0),
            purchase_roas: dailySeries.reduce((s, d) => s + d.purchase_roas, 0) / n,
            impressions: dailySeries.reduce((s, d) => s + d.impressions, 0),
            clicks: dailySeries.reduce((s, d) => s + d.clicks, 0),
            ctr: dailySeries.reduce((s, d) => s + d.ctr, 0) / n,
            reach: dailySeries.reduce((s, d) => s + (d.reach ?? 0), 0),
            frequency: dailySeries.reduce((s, d) => s + (d.frequency ?? 0), 0) / n,
            video_views: dailySeries.reduce((s, d) => s + (d.video_views ?? 0), 0),
            video_view_rate: dailySeries.reduce((s, d) => s + (d.video_view_rate ?? 0), 0) / n,
            engagement_rate: dailySeries.reduce((s, d) => s + (d.engagement_rate ?? 0), 0) / n,
            cost_per_engagement: dailySeries.reduce((s, d) => s + (d.cost_per_engagement ?? 0), 0) / n,
            post_likes: dailySeries.reduce((s, d) => s + (d.post_likes ?? 0), 0),
            post_comments: dailySeries.reduce((s, d) => s + (d.post_comments ?? 0), 0),
            post_shares: dailySeries.reduce((s, d) => s + (d.post_shares ?? 0), 0),
          }
        }
      } catch {
        // insights failure is non-fatal
      }
    }

    const fetchedAt = new Date().toISOString()
    await writeJSON(cacheKey, { fetchedAt, campaigns })
    return NextResponse.json({ campaigns, fetchedAt, fromCache: false })
  } catch (err) {
    const isDev = process.env.NODE_ENV === "development"
    return NextResponse.json({ error: isDev ? String(err) : "Internal server error" }, { status: 500 })
  }
}
