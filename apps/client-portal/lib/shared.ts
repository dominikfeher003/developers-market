// Vendored from packages/shared/index.ts — keep in sync manually.

export type MetricKey =
  | "purchase_roas" | "spend" | "impressions" | "clicks" | "ctr"
  | "reach" | "frequency" | "video_views" | "video_view_rate"
  | "engagement_rate" | "cost_per_engagement"
  | "post_likes" | "post_comments" | "post_shares"

export type Operator = "less_than" | "greater_than" | "equals"
export type RuleAction = "pause" | "resume" | "scale_budget" | "notify_only"
export type CampaignStatus = "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED"

export interface DailyInsight {
  date: string
  spend: number
  purchase_roas: number
  impressions: number
  clicks: number
  ctr: number
  reach: number
  frequency: number
  video_views: number
  video_view_rate: number
  engagement_rate: number
  cost_per_engagement: number
  post_likes: number
  post_comments: number
  post_shares: number
}

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  daily_budget: number | null
  platform?: "meta" | "tiktok"
  insights: {
    last7d: Omit<DailyInsight, "date">
    dailySeries: DailyInsight[]
  }
}

export interface Client {
  id: string
  name: string
  metaAdAccountId: string
  metaAccessToken: string
  tiktokAdAccountId?: string
  tiktokAccessToken?: string
  googleAdsCustomerId?: string
  googleAdsRefreshToken?: string
  enabled: boolean
  createdAt: string
  userEmail?: string
}

export interface Rule {
  id: string
  name: string
  enabled: boolean
  metric: MetricKey
  operator: Operator
  threshold: number
  windowDays: number
  action: RuleAction
  actionValue: number | null
  appliesTo: "all" | "specific"
  campaignIds: string[]
  clientId: string | null
  createdAt: string
  updatedAt: string
}

export interface Alert {
  id: string
  timestamp: string
  ruleId: string
  ruleName: string
  campaignId: string
  campaignName: string
  action: RuleAction
  actionValue: number | null
  metricValue: number
  metricName: MetricKey
  status: "success" | "error" | "skipped"
  errorMessage: string | null
  agentRunId: string
}
