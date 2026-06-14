import { Campaign, DailyInsight, CampaignStatus } from "./types"

const BASE = "https://business-api.tiktok.com/open_api/v1.3"

interface TikTokResponse<T> {
  code: number
  message: string
  data: T
}

async function tiktokFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const json = (await res.json()) as TikTokResponse<T>
  if (json.code !== 0) {
    throw new Error(`TikTok API ${json.code}: ${json.message}`)
  }
  return json.data
}

function mapStatus(status: string): CampaignStatus {
  if (status === "CAMPAIGN_STATUS_ENABLE") return "ACTIVE"
  if (status === "CAMPAIGN_STATUS_DISABLE") return "PAUSED"
  if (status === "CAMPAIGN_STATUS_ARCHIVED") return "ARCHIVED"
  return "DELETED"
}

function dateRange(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days + 1)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

const emptyInsight = (): Omit<DailyInsight, "date"> => ({
  spend: 0, purchase_roas: 0, impressions: 0, clicks: 0, ctr: 0,
  reach: 0, frequency: 0, video_views: 0, video_view_rate: 0,
  engagement_rate: 0, cost_per_engagement: 0,
  post_likes: 0, post_comments: 0, post_shares: 0,
})

type CampaignRow = {
  campaign_id: string
  campaign_name: string
  status: string
  budget: number
  budget_mode: string
}

export async function fetchTikTokCampaigns(advertiserId: string, token: string): Promise<Campaign[]> {
  const fields = encodeURIComponent(
    JSON.stringify(["campaign_id", "campaign_name", "status", "budget", "budget_mode"])
  )
  const url = `${BASE}/campaign/get/?advertiser_id=${advertiserId}&fields=${fields}&page_size=100`

  const data = await tiktokFetch<{ list: CampaignRow[] }>(url, {
    headers: { "Access-Token": token },
  })

  return (data.list ?? [])
    .filter((c) => c.status !== "CAMPAIGN_STATUS_DELETE")
    .map((c) => ({
      id: c.campaign_id,
      name: c.campaign_name,
      status: mapStatus(c.status),
      daily_budget: c.budget_mode === "BUDGET_MODE_DAY" ? Math.round(c.budget * 100) : null,
      platform: "tiktok" as const,
      insights: { last7d: emptyInsight(), dailySeries: [] },
    }))
}

type InsightRow = {
  dimensions: { campaign_id: string; stat_time_day: string }
  metrics: Record<string, string>
}

export async function fetchTikTokInsights(
  campaignId: string,
  advertiserId: string,
  token: string,
  days = 7
): Promise<DailyInsight[]> {
  const { start, end } = dateRange(days)

  const body = {
    advertiser_id: advertiserId,
    report_type: "BASIC",
    data_level: "AUCTION_CAMPAIGN",
    dimensions: ["campaign_id", "stat_time_day"],
    metrics: [
      "spend", "impressions", "clicks", "ctr", "reach", "frequency",
      "video_play_actions", "likes", "comments", "shares",
      "complete_payment_roas",
    ],
    filters: [
      { field_name: "campaign_ids", filter_type: "IN", filter_value: JSON.stringify([campaignId]) },
    ],
    start_date: start,
    end_date: end,
    page_size: days + 5,
    order_field: "stat_time_day",
    order_type: "ASC",
  }

  const data = await tiktokFetch<{ list: InsightRow[] }>(
    `${BASE}/report/integrated/get/`,
    {
      method: "POST",
      headers: { "Access-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )

  return (data.list ?? []).map((row) => {
    const m = row.metrics
    const impressions = parseFloat(m.impressions || "0")
    const video_views = parseFloat(m.video_play_actions || "0")
    const reach = parseFloat(m.reach || "0")
    const post_likes = parseFloat(m.likes || "0")
    const post_comments = parseFloat(m.comments || "0")
    const post_shares = parseFloat(m.shares || "0")
    const total_engagements = post_likes + post_comments + post_shares

    return {
      date: row.dimensions.stat_time_day.slice(0, 10),
      spend: parseFloat(m.spend || "0"),
      purchase_roas: parseFloat(m.complete_payment_roas || "0"),
      impressions,
      clicks: parseFloat(m.clicks || "0"),
      ctr: parseFloat(m.ctr || "0") / 100,
      reach,
      frequency: parseFloat(m.frequency || "0"),
      video_views,
      video_view_rate: impressions > 0 ? (video_views / impressions) * 100 : 0,
      post_likes,
      post_comments,
      post_shares,
      engagement_rate: reach > 0 ? (total_engagements / reach) * 100 : 0,
      cost_per_engagement: total_engagements > 0 ? parseFloat(m.spend || "0") / total_engagements : 0,
    }
  })
}

export async function pauseTikTokCampaign(
  campaignId: string,
  advertiserId: string,
  token: string
): Promise<boolean> {
  await tiktokFetch(`${BASE}/campaign/update/`, {
    method: "POST",
    headers: { "Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ advertiser_id: advertiserId, campaign_id: campaignId, opt_status: "DISABLE" }),
  })
  return true
}

export async function resumeTikTokCampaign(
  campaignId: string,
  advertiserId: string,
  token: string
): Promise<boolean> {
  await tiktokFetch(`${BASE}/campaign/update/`, {
    method: "POST",
    headers: { "Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ advertiser_id: advertiserId, campaign_id: campaignId, opt_status: "ENABLE" }),
  })
  return true
}

export async function updateTikTokDailyBudget(
  campaignId: string,
  advertiserId: string,
  token: string,
  budgetCents: number
): Promise<boolean> {
  await tiktokFetch(`${BASE}/campaign/update/`, {
    method: "POST",
    headers: { "Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({
      advertiser_id: advertiserId,
      campaign_id: campaignId,
      budget: budgetCents / 100,
      budget_mode: "BUDGET_MODE_DAY",
    }),
  })
  return true
}
