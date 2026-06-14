import { Campaign, DailyInsight } from "./types"

// Google Ads API v18
// Requires env vars: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET
// Per-client: googleAdsCustomerId + googleAdsRefreshToken (stored in DB via Clients Manager)
//
// How to acquire credentials:
// 1. Create a Google Ads Manager Account at ads.google.com
// 2. Go to Tools → API Center → Apply for Developer Token (basic access approved in ~24h)
// 3. In Google Cloud Console → APIs & Services → Enable "Google Ads API"
// 4. Create OAuth 2.0 credentials (Web application), add redirect URI: https://developers.google.com/oauthplayground
// 5. Use OAuth Playground (developers.google.com/oauthplayground) to generate refresh tokens per client
//    - Scope: https://www.googleapis.com/auth/adwords
// 6. Set GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET in Vercel env vars
// 7. Store each client's refresh token + customer ID via the Clients Manager in ad-monitor

const BASE_URL = "https://googleads.googleapis.com/v18"

function requireEnv() {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
  if (!token || !clientId || !clientSecret) {
    throw new Error("GOOGLE_ADS_NOT_CONFIGURED: Set GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET in Vercel env vars")
  }
  return { token, clientId, clientSecret }
}

async function getAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  if (!res.ok) throw new Error(`Google OAuth failed: ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}

export async function fetchGoogleCampaigns(
  customerId: string,
  refreshToken: string
): Promise<Campaign[]> {
  const { token, clientId, clientSecret } = requireEnv()
  const accessToken = await getAccessToken(refreshToken, clientId, clientSecret)

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status IN ('ENABLED', 'PAUSED')
    ORDER BY campaign.id
    LIMIT 500`

  const res = await fetch(`${BASE_URL}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`Google Ads campaigns fetch failed: ${await res.text()}`)
  const data = await res.json()

  const results = (data.results ?? []) as Array<{
    campaign: { id: string; name: string; status: string }
    campaignBudget?: { amountMicros: string }
  }>

  return results.map((r) => ({
    id: r.campaign.id,
    name: r.campaign.name,
    status: r.campaign.status === "ENABLED" ? "ACTIVE" : "PAUSED",
    daily_budget: r.campaignBudget ? Math.round(parseInt(r.campaignBudget.amountMicros) / 1000) : null,
    platform: "meta" as const, // placeholder; update to "google" when platform type is extended
    insights: { last7d: emptyInsights(), dailySeries: [] },
  }))
}

export async function fetchGoogleInsights(
  campaignId: string,
  customerId: string,
  refreshToken: string,
  days: number
): Promise<DailyInsight[]> {
  const { token, clientId, clientSecret } = requireEnv()
  const accessToken = await getAccessToken(refreshToken, clientId, clientSecret)

  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const query = `
    SELECT
      segments.date,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions_value,
      metrics.conversions
    FROM campaign
    WHERE campaign.id = '${campaignId}'
      AND segments.date BETWEEN '${fmt(start)}' AND '${fmt(end)}'`

  const res = await fetch(`${BASE_URL}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`Google Ads insights fetch failed: ${await res.text()}`)
  const data = await res.json()

  const results = (data.results ?? []) as Array<{
    segments: { date: string }
    metrics: {
      costMicros: string
      impressions: string
      clicks: string
      conversionsValue: string
      conversions: string
    }
  }>

  return results.map((r) => {
    const spend = parseInt(r.metrics.costMicros) / 1_000_000
    const conversionsValue = parseFloat(r.metrics.conversionsValue)
    const roas = spend > 0 ? conversionsValue / spend : 0
    return {
      date: r.segments.date,
      spend,
      purchase_roas: roas,
      impressions: parseInt(r.metrics.impressions),
      clicks: parseInt(r.metrics.clicks),
      ctr: parseInt(r.metrics.impressions) > 0 ? parseInt(r.metrics.clicks) / parseInt(r.metrics.impressions) : 0,
      reach: 0,
      frequency: 0,
      video_views: 0,
      video_view_rate: 0,
      engagement_rate: 0,
      cost_per_engagement: 0,
      post_likes: 0,
      post_comments: 0,
      post_shares: 0,
    }
  })
}

export async function pauseGoogleCampaign(
  campaignId: string,
  customerId: string,
  refreshToken: string
): Promise<void> {
  const { token, clientId, clientSecret } = requireEnv()
  const accessToken = await getAccessToken(refreshToken, clientId, clientSecret)
  const res = await fetch(`${BASE_URL}/customers/${customerId}/campaigns:mutate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operations: [{ update: { resourceName: `customers/${customerId}/campaigns/${campaignId}`, status: "PAUSED" }, updateMask: "status" }],
    }),
  })
  if (!res.ok) throw new Error(`Google Ads pause failed: ${await res.text()}`)
}

export async function resumeGoogleCampaign(
  campaignId: string,
  customerId: string,
  refreshToken: string
): Promise<void> {
  const { token, clientId, clientSecret } = requireEnv()
  const accessToken = await getAccessToken(refreshToken, clientId, clientSecret)
  const res = await fetch(`${BASE_URL}/customers/${customerId}/campaigns:mutate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operations: [{ update: { resourceName: `customers/${customerId}/campaigns/${campaignId}`, status: "ENABLED" }, updateMask: "status" }],
    }),
  })
  if (!res.ok) throw new Error(`Google Ads resume failed: ${await res.text()}`)
}

export async function updateGoogleDailyBudget(
  campaignId: string,
  customerId: string,
  refreshToken: string,
  newBudgetCents: number
): Promise<void> {
  const { token, clientId, clientSecret } = requireEnv()
  const accessToken = await getAccessToken(refreshToken, clientId, clientSecret)
  // First get the budget resource name, then update it
  const res = await fetch(`${BASE_URL}/customers/${customerId}/campaigns:mutate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operations: [{
        update: {
          resourceName: `customers/${customerId}/campaignBudgets/${campaignId}`,
          amountMicros: (newBudgetCents * 1000).toString(),
        },
        updateMask: "amount_micros",
      }],
    }),
  })
  if (!res.ok) throw new Error(`Google Ads budget update failed: ${await res.text()}`)
}

function emptyInsights(): Omit<DailyInsight, "date"> {
  return {
    spend: 0, purchase_roas: 0, impressions: 0, clicks: 0, ctr: 0,
    reach: 0, frequency: 0, video_views: 0, video_view_rate: 0,
    engagement_rate: 0, cost_per_engagement: 0,
    post_likes: 0, post_comments: 0, post_shares: 0,
  }
}
