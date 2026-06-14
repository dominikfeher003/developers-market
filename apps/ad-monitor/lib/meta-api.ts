import { Campaign, DailyInsight, CampaignStatus } from "./types"

const BASE = "https://graph.facebook.com/v19.0"

interface MetaError {
  message: string
  code: number
}

function authHeader(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

async function metaFetch(url: string, options?: RequestInit): Promise<unknown> {
  const res = await fetch(url, options)
  const json = await res.json() as { error?: MetaError }
  if (json.error) {
    throw Object.assign(new Error(json.error.message), { code: json.error.code })
  }
  return json
}

export async function fetchCampaigns(accountId: string, token: string): Promise<Campaign[]> {
  const url =
    `${BASE}/act_${accountId}/campaigns` +
    `?fields=id,name,status,daily_budget,lifetime_budget` +
    `&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED"]}]` +
    `&limit=200`

  const data = await metaFetch(url, { headers: authHeader(token) }) as { data: Array<{ id: string; name: string; status: CampaignStatus; daily_budget?: string; lifetime_budget?: string }> }

  return data.data.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    daily_budget: c.daily_budget ? parseInt(c.daily_budget) : null,
    insights: {
      last7d: { spend: 0, purchase_roas: 0, impressions: 0, clicks: 0, ctr: 0, reach: 0, frequency: 0, video_views: 0, video_view_rate: 0, engagement_rate: 0, cost_per_engagement: 0, post_likes: 0, post_comments: 0, post_shares: 0 },
      dailySeries: [],
    },
  }))
}

export async function fetchCampaignInsights(
  campaignId: string,
  token: string,
  days = 7
): Promise<DailyInsight[]> {
  const url =
    `${BASE}/${campaignId}/insights` +
    `?fields=spend,purchase_roas,impressions,clicks,ctr,date_start,reach,frequency,video_p25_watched_actions,actions` +
    `&date_preset=last_${days}d` +
    `&time_increment=1` +
    `&limit=${days}`

  type ActionEntry = { action_type: string; value: string }
  const data = await metaFetch(url, { headers: authHeader(token) }) as {
    data: Array<{
      date_start: string
      spend: string
      purchase_roas?: ActionEntry[]
      impressions: string
      clicks: string
      ctr: string
      reach?: string
      frequency?: string
      video_p25_watched_actions?: ActionEntry[]
      actions?: ActionEntry[]
    }>
  }

  return data.data.map((d) => {
    const findAction = (arr: ActionEntry[] | undefined, ...types: string[]) => {
      for (const t of types) {
        const e = arr?.find((a) => a.action_type === t)
        if (e) return parseInt(e.value) || 0
      }
      return 0
    }

    const roasEntry = d.purchase_roas?.find((r) => r.action_type === "purchase")
    const impressions = parseInt(d.impressions || "0")
    const reach = parseInt(d.reach || "0")
    const video_views = findAction(d.video_p25_watched_actions, "video_view")
    const post_likes = findAction(d.actions, "post_reaction", "like")
    const post_comments = findAction(d.actions, "comment")
    const post_shares = findAction(d.actions, "post", "share")
    const total_engagements = post_likes + post_comments + post_shares

    return {
      date: d.date_start,
      spend: parseFloat(d.spend || "0"),
      purchase_roas: roasEntry ? parseFloat(roasEntry.value) : 0,
      impressions,
      clicks: parseInt(d.clicks || "0"),
      ctr: parseFloat(d.ctr || "0"),
      reach,
      frequency: parseFloat(d.frequency || "0"),
      video_views,
      video_view_rate: impressions > 0 ? (video_views / impressions) * 100 : 0,
      post_likes,
      post_comments,
      post_shares,
      engagement_rate: reach > 0 ? (total_engagements / reach) * 100 : 0,
      cost_per_engagement: total_engagements > 0 ? parseFloat(d.spend || "0") / total_engagements : 0,
    }
  })
}

export async function pauseCampaign(campaignId: string, token: string): Promise<boolean> {
  await metaFetch(`${BASE}/${campaignId}`, {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({ status: "PAUSED" }),
  })
  return true
}

export async function resumeCampaign(campaignId: string, token: string): Promise<boolean> {
  await metaFetch(`${BASE}/${campaignId}`, {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ACTIVE" }),
  })
  return true
}

export async function updateDailyBudget(
  campaignId: string,
  token: string,
  budgetCents: number
): Promise<boolean> {
  await metaFetch(`${BASE}/${campaignId}`, {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({ daily_budget: budgetCents }),
  })
  return true
}

export async function validateToken(
  token: string
): Promise<{ valid: boolean; scopes: string[] }> {
  try {
    const data = await metaFetch(
      `${BASE}/me?fields=id,name`,
      { headers: authHeader(token) }
    ) as { id: string }
    return { valid: !!data.id, scopes: [] }
  } catch {
    return { valid: false, scopes: [] }
  }
}
