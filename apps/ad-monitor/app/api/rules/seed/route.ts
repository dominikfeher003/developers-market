import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { readRules, writeJSON } from "@/lib/storage"
import { Rule } from "@/lib/types"

const now = () => new Date().toISOString()

function makeRule(partial: Omit<Rule, "id" | "createdAt" | "updatedAt" | "appliesTo" | "campaignIds" | "enabled" | "clientId">, clientId: string | null): Rule {
  return {
    ...partial,
    clientId,
    id: `rule_${nanoid()}`,
    enabled: true,
    appliesTo: "all",
    campaignIds: [],
    createdAt: now(),
    updatedAt: now(),
  }
}

function makeDefaultRules(clientId: string | null): Rule[] {
  return [
    // Performance
    makeRule({ name: "Low ROAS — Pause", metric: "purchase_roas", operator: "less_than", threshold: 1.0, windowDays: 3, action: "pause", actionValue: null }, clientId),
    makeRule({ name: "ROAS Warning", metric: "purchase_roas", operator: "less_than", threshold: 1.5, windowDays: 5, action: "notify_only", actionValue: null }, clientId),
    makeRule({ name: "Strong ROAS — Scale Up", metric: "purchase_roas", operator: "greater_than", threshold: 3.5, windowDays: 3, action: "scale_budget", actionValue: 20 }, clientId),
    makeRule({ name: "Overspend Alert", metric: "spend", operator: "greater_than", threshold: 200, windowDays: 1, action: "notify_only", actionValue: null }, clientId),

    // CTR
    makeRule({ name: "High CTR — Scale Up", metric: "ctr", operator: "greater_than", threshold: 3.0, windowDays: 3, action: "scale_budget", actionValue: 10 }, clientId),
    makeRule({ name: "Low CTR — Pause", metric: "ctr", operator: "less_than", threshold: 0.5, windowDays: 5, action: "pause", actionValue: null }, clientId),
    makeRule({ name: "CTR Drop Warning", metric: "ctr", operator: "less_than", threshold: 1.0, windowDays: 3, action: "notify_only", actionValue: null }, clientId),

    // Frequency / Reach (Facebook, Instagram, TikTok)
    makeRule({ name: "Ad Fatigue Warning", metric: "frequency", operator: "greater_than", threshold: 4.0, windowDays: 3, action: "notify_only", actionValue: null }, clientId),
    makeRule({ name: "Severe Ad Fatigue — Pause", metric: "frequency", operator: "greater_than", threshold: 7.0, windowDays: 1, action: "pause", actionValue: null }, clientId),
    makeRule({ name: "Low Reach Warning", metric: "reach", operator: "less_than", threshold: 500, windowDays: 3, action: "notify_only", actionValue: null }, clientId),

    // Engagement (Facebook, Instagram, TikTok)
    makeRule({ name: "Low Engagement Rate", metric: "engagement_rate", operator: "less_than", threshold: 1.0, windowDays: 3, action: "notify_only", actionValue: null }, clientId),
    makeRule({ name: "High Cost per Engagement", metric: "cost_per_engagement", operator: "greater_than", threshold: 2.0, windowDays: 3, action: "pause", actionValue: null }, clientId),

    // Video (Reels, TikTok, FB Video)
    makeRule({ name: "Low Video View Rate — Pause", metric: "video_view_rate", operator: "less_than", threshold: 15.0, windowDays: 3, action: "pause", actionValue: null }, clientId),
    makeRule({ name: "Strong Video — Scale Up", metric: "video_view_rate", operator: "greater_than", threshold: 40.0, windowDays: 3, action: "scale_budget", actionValue: 15 }, clientId),
    makeRule({ name: "Low Video Views Warning", metric: "video_views", operator: "less_than", threshold: 100, windowDays: 3, action: "notify_only", actionValue: null }, clientId),

    // Volume drops
    makeRule({ name: "Impressions Drop", metric: "impressions", operator: "less_than", threshold: 500, windowDays: 3, action: "notify_only", actionValue: null }, clientId),
    makeRule({ name: "Clicks Drop", metric: "clicks", operator: "less_than", threshold: 20, windowDays: 3, action: "notify_only", actionValue: null }, clientId),

    // Social signals
    makeRule({ name: "Comments Spike", metric: "post_comments", operator: "greater_than", threshold: 50, windowDays: 1, action: "notify_only", actionValue: null }, clientId),
  ]
}

export async function POST(req: NextRequest) {
  let clientId: string | null = null
  try {
    const body = await req.json()
    clientId = typeof body.clientId === "string" ? body.clientId : null
  } catch {
    // no body or not JSON — clientId stays null
  }
  const defaults = makeDefaultRules(clientId)
  const existing = await readRules()
  const combined = [...existing, ...defaults]
  await writeJSON("rules.json", combined)
  return NextResponse.json({ added: defaults.length })
}
