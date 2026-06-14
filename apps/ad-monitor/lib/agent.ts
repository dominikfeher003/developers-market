import { nanoid } from "nanoid"
import {
  readSettings,
  writeSettings,
  readRules,
  readClients,
  writeJSON,
  appendAlert,
} from "./storage"
import {
  fetchCampaigns,
  fetchCampaignInsights,
  pauseCampaign,
  resumeCampaign,
  updateDailyBudget,
} from "./meta-api"
import {
  fetchTikTokCampaigns,
  fetchTikTokInsights,
  pauseTikTokCampaign,
  resumeTikTokCampaign,
  updateTikTokDailyBudget,
} from "./tiktok-api"
import { sendAlertEmail } from "./email"
import { Alert, Campaign, DailyInsight, MetricKey, Rule } from "./types"

interface CacheData {
  fetchedAt: string | null
  campaigns: Campaign[]
}

function getMetricValue(insight: DailyInsight, metric: MetricKey): number {
  return (insight as unknown as Record<string, number>)[metric] ?? 0
}

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

function evaluateWindow(
  dailySeries: DailyInsight[],
  metric: MetricKey,
  operator: Rule["operator"],
  threshold: number,
  windowDays: number,
  log: string[],
  label: string
): boolean {
  const window = dailySeries.slice(-windowDays)
  if (window.length === 0) {
    log.push(`  → no data available — skipped`)
    return false
  }
  if (window.length < windowDays) {
    log.push(`  → only ${window.length}/${windowDays} days of data — evaluating with available data`)
  }
  const values = window.map((d) => getMetricValue(d, metric))
  const opSymbol = operator === "less_than" ? "<" : operator === "greater_than" ? ">" : "="
  log.push(`  → ${label} values: [${values.map((v) => v.toFixed(2)).join(", ")}] — checking if ALL ${opSymbol} ${threshold}`)
  return window.every((day) => {
    const val = getMetricValue(day, metric)
    if (operator === "less_than") return val < threshold
    if (operator === "greater_than") return val > threshold
    return val === threshold
  })
}

async function executeAction(
  action: Rule["action"],
  campaign: Campaign,
  metaToken: string,
  tiktokToken: string | undefined,
  tiktokAccountId: string | undefined,
  actionValue: number | null,
  log: string[]
): Promise<void> {
  const isTikTok = campaign.platform === "tiktok"

  if (action === "pause") {
    if (isTikTok && tiktokToken && tiktokAccountId) {
      await pauseTikTokCampaign(campaign.id, tiktokAccountId, tiktokToken)
    } else {
      await pauseCampaign(campaign.id, metaToken)
    }
    campaign.status = "PAUSED"
    log.push(`  → PAUSED successfully`)
  } else if (action === "resume") {
    if (isTikTok && tiktokToken && tiktokAccountId) {
      await resumeTikTokCampaign(campaign.id, tiktokAccountId, tiktokToken)
    } else {
      await resumeCampaign(campaign.id, metaToken)
    }
    campaign.status = "ACTIVE"
    log.push(`  → RESUMED successfully`)
  } else if (action === "scale_budget") {
    if (campaign.daily_budget === null) throw new Error("campaign has lifetime budget")
    const pct = actionValue ?? 0
    const newBudget = Math.round(campaign.daily_budget * (1 + pct / 100))
    if (isTikTok && tiktokToken && tiktokAccountId) {
      await updateTikTokDailyBudget(campaign.id, tiktokAccountId, tiktokToken, newBudget)
    } else {
      await updateDailyBudget(campaign.id, metaToken, newBudget)
    }
    campaign.daily_budget = newBudget
    log.push(`  → budget scaled ${pct > 0 ? "+" : ""}${pct}% → $${(newBudget / 100).toFixed(0)}/day`)
  } else if (action === "notify_only") {
    log.push(`  → notify only — no API action taken`)
  }
}

export async function runAgent(): Promise<{
  success: boolean
  actionsCount: number
  runId: string
  errors: string[]
  log: string[]
}> {
  const runId = `run_${Date.now()}`
  const errors: string[] = []
  const firedAlerts: Alert[] = []
  const log: string[] = []

  const settings = await readSettings()
  const clients = await readClients()
  const allRules = (await readRules()).filter((r) => r.enabled)

  type Target = {
    metaAccountId: string
    metaToken: string
    tiktokAccountId?: string
    tiktokToken?: string
    clientId: string | null
    label: string
  }

  const targets: Target[] = []
  if (settings.metaAdAccountId && settings.metaAccessToken) {
    targets.push({ metaAccountId: settings.metaAdAccountId, metaToken: settings.metaAccessToken, clientId: null, label: "Default" })
  }
  for (const client of clients.filter((c) => c.enabled)) {
    if (client.metaAdAccountId && client.metaAccessToken) {
      targets.push({
        metaAccountId: client.metaAdAccountId,
        metaToken: client.metaAccessToken,
        tiktokAccountId: client.tiktokAdAccountId,
        tiktokToken: client.tiktokAccessToken,
        clientId: client.id,
        label: client.name,
      })
    }
  }

  if (targets.length === 0) {
    return { success: false, actionsCount: 0, runId, errors: ["No Meta credentials configured"], log: ["No credentials configured — check Settings"] }
  }

  for (const target of targets) {
    const { metaAccountId, metaToken, tiktokAccountId, tiktokToken, clientId, label } = target
    const cacheKey = clientId ? `cache-${clientId}.json` : "cache.json"
    const rules = allRules.filter((r) => (r.clientId ?? null) === clientId)

    log.push(`\n=== ${label} (${rules.length} rule(s)) ===`)

    // Fetch all campaigns (Meta + TikTok in parallel)
    let campaigns: Campaign[] = []
    try {
      const [metaCampaigns, tiktokCampaigns] = await Promise.all([
        fetchCampaigns(metaAccountId, metaToken).then((cs) =>
          cs.map((c) => ({ ...c, platform: "meta" as const }))
        ),
        tiktokAccountId && tiktokToken
          ? fetchTikTokCampaigns(tiktokAccountId, tiktokToken)
          : Promise.resolve([] as Campaign[]),
      ])
      campaigns = [...metaCampaigns, ...tiktokCampaigns]
      log.push(`Fetched ${metaCampaigns.length} Meta + ${tiktokCampaigns.length} TikTok campaign(s)`)
    } catch (err) {
      errors.push(`[${label}] Failed to fetch campaigns: ${err}`)
      log.push(`Failed to fetch campaigns: ${err}`)
      continue
    }

    // Fetch insights per campaign
    for (const campaign of campaigns) {
      try {
        const isTikTok = campaign.platform === "tiktok"
        const series = isTikTok && tiktokAccountId && tiktokToken
          ? await fetchTikTokInsights(campaign.id, tiktokAccountId, tiktokToken, 7)
          : await fetchCampaignInsights(campaign.id, metaToken, 7)

        campaign.insights.dailySeries = series
        if (series.length > 0) {
          campaign.insights.last7d = aggregateInsights(series)
        }
        log.push(`"${campaign.name}" [${isTikTok ? "TikTok" : "Meta"}] — ${series.length} days, avg ROAS ${campaign.insights.last7d.purchase_roas.toFixed(2)}`)
      } catch (err) {
        errors.push(`[${label}] Insights failed for ${campaign.name}: ${err}`)
        log.push(`"${campaign.name}" — insights fetch failed: ${err}`)
      }
    }

    // Write cache
    await writeJSON(cacheKey, { fetchedAt: new Date().toISOString(), campaigns } satisfies CacheData)

    if (rules.length === 0) {
      log.push(`No rules for this client — skipping rule evaluation`)
      continue
    }

    log.push(`\nEvaluating ${rules.length} rule(s) against ${campaigns.length} campaign(s)`)

    for (const rule of rules) {
      log.push(`\nRule: "${rule.name}" — ${rule.metric} ${rule.operator === "less_than" ? "<" : ">"} ${rule.threshold} for ${rule.windowDays}d → ${rule.action}`)

      const ruleTargets = rule.appliesTo === "specific"
        ? campaigns.filter((c) => rule.campaignIds.includes(c.id))
        : campaigns

      for (const campaign of ruleTargets) {
        log.push(`  Campaign: "${campaign.name}" (${campaign.status}) [${campaign.platform ?? "meta"}]`)
        const series = campaign.insights.dailySeries

        const conditionMet = evaluateWindow(
          series,
          rule.metric,
          rule.operator,
          rule.threshold,
          rule.windowDays,
          log,
          rule.metric
        )

        if (!conditionMet) { log.push(`  → condition NOT met — no action`); continue }

        if (rule.action === "pause" && campaign.status === "PAUSED") {
          log.push(`  → condition met but campaign already PAUSED — skipped`); continue
        }
        if (rule.action === "resume" && campaign.status === "ACTIVE") {
          log.push(`  → condition met but campaign already ACTIVE — skipped`); continue
        }
        if (rule.action === "scale_budget" && campaign.daily_budget === null) {
          log.push(`  → condition met but campaign has lifetime budget — cannot scale`)
          errors.push(`[${label}] Cannot scale budget for ${campaign.name} (lifetime budget)`)
          continue
        }

        const lastDay = series.length > 0 ? series[series.length - 1] : null
        const lastDayValue = lastDay ? getMetricValue(lastDay, rule.metric) : 0

        const alert: Alert = {
          id: `alert_${nanoid()}`,
          timestamp: new Date().toISOString(),
          ruleId: rule.id,
          ruleName: rule.name,
          campaignId: campaign.id,
          campaignName: campaign.name,
          action: rule.action,
          actionValue: rule.actionValue,
          metricValue: lastDayValue,
          metricName: rule.metric,
          status: "success",
          errorMessage: null,
          agentRunId: runId,
        }

        try {
          await executeAction(rule.action, campaign, metaToken, tiktokToken, tiktokAccountId, rule.actionValue, log)
        } catch (err) {
          alert.status = "error"
          alert.errorMessage = String(err)
          errors.push(`[${label}] Action failed for ${campaign.name}: ${err}`)
          log.push(`  → action FAILED: ${err}`)
        }

        firedAlerts.push(alert)
        await appendAlert(alert)
      }
    }
  }

  if (firedAlerts.length > 0) {
    await sendAlertEmail(firedAlerts, settings)
  }

  await writeSettings({ lastAgentRun: new Date().toISOString() })

  const actionsCount = firedAlerts.filter((a) => a.status === "success").length
  log.push(`\nDone — ${actionsCount} action(s) taken, ${errors.length} error(s)`)

  return { success: true, actionsCount, runId, errors, log }
}
