import { nanoid } from "nanoid"
import {
  readSettings,
  writeSettings,
  readRules,
  readClients,
  readJSON,
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
import { sendAlertEmail } from "./email"
import { Alert, Campaign, MetricKey, Rule } from "./types"

interface CacheData {
  fetchedAt: string | null
  campaigns: Campaign[]
}

function getMetricValue(insight: Record<string, number>, metric: MetricKey): number {
  return insight[metric] ?? 0
}

function evaluateWindow(
  dailySeries: Array<Record<string, number>>,
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

  // Build per-target list: default (settings) + each enabled client
  const targets: { accountId: string; token: string; clientId: string | null; label: string }[] = []
  if (settings.metaAdAccountId && settings.metaAccessToken) {
    targets.push({ accountId: settings.metaAdAccountId, token: settings.metaAccessToken, clientId: null, label: "Default" })
  }
  for (const client of clients.filter((c) => c.enabled)) {
    if (client.metaAdAccountId && client.metaAccessToken) {
      targets.push({ accountId: client.metaAdAccountId, token: client.metaAccessToken, clientId: client.id, label: client.name })
    }
  }

  if (targets.length === 0) {
    return { success: false, actionsCount: 0, runId, errors: ["No Meta credentials configured"], log: ["No Meta credentials — configure in Settings or add a client"] }
  }

  for (const target of targets) {
    const { accountId, token, clientId, label } = target
    const cacheKey = clientId ? `cache-${clientId}.json` : "cache.json"
    const rules = allRules.filter((r) => (r.clientId ?? null) === clientId)

    log.push(`\n=== ${label} (${rules.length} rule(s)) ===`)

    // Fetch campaigns
    let campaigns: Campaign[]
    try {
      campaigns = await fetchCampaigns(accountId, token)
      log.push(`Fetched ${campaigns.length} campaign(s)`)
    } catch (err) {
      errors.push(`[${label}] Failed to fetch campaigns: ${err}`)
      log.push(`Failed to fetch campaigns: ${err}`)
      continue
    }

    // Fetch insights for each campaign
    for (const campaign of campaigns) {
      try {
        const dailySeries = await fetchCampaignInsights(campaign.id, token, 7)
        campaign.insights.dailySeries = dailySeries

        if (dailySeries.length > 0) {
          const totals = dailySeries.reduce(
            (acc, d) => ({
              spend: acc.spend + d.spend,
              purchase_roas: acc.purchase_roas + d.purchase_roas,
              impressions: acc.impressions + d.impressions,
              clicks: acc.clicks + d.clicks,
              ctr: acc.ctr + d.ctr,
              reach: acc.reach + (d.reach ?? 0),
              frequency: acc.frequency + (d.frequency ?? 0),
              video_views: acc.video_views + (d.video_views ?? 0),
              video_view_rate: acc.video_view_rate + (d.video_view_rate ?? 0),
              engagement_rate: acc.engagement_rate + (d.engagement_rate ?? 0),
              cost_per_engagement: acc.cost_per_engagement + (d.cost_per_engagement ?? 0),
              post_likes: acc.post_likes + (d.post_likes ?? 0),
              post_comments: acc.post_comments + (d.post_comments ?? 0),
              post_shares: acc.post_shares + (d.post_shares ?? 0),
            }),
            { spend: 0, purchase_roas: 0, impressions: 0, clicks: 0, ctr: 0, reach: 0, frequency: 0, video_views: 0, video_view_rate: 0, engagement_rate: 0, cost_per_engagement: 0, post_likes: 0, post_comments: 0, post_shares: 0 }
          )
          const n = dailySeries.length
          campaign.insights.last7d = {
            spend: totals.spend,
            purchase_roas: totals.purchase_roas / n,
            impressions: totals.impressions,
            clicks: totals.clicks,
            ctr: totals.ctr / n,
            reach: totals.reach,
            frequency: totals.frequency / n,
            video_views: totals.video_views,
            video_view_rate: totals.video_view_rate / n,
            engagement_rate: totals.engagement_rate / n,
            cost_per_engagement: totals.cost_per_engagement / n,
            post_likes: totals.post_likes,
            post_comments: totals.post_comments,
            post_shares: totals.post_shares,
          }
        }
        log.push(`"${campaign.name}" — ${dailySeries.length} days of data, avg ROAS ${campaign.insights.last7d.purchase_roas.toFixed(2)}`)
      } catch (err) {
        errors.push(`[${label}] Insights fetch failed for ${campaign.name}: ${err}`)
        log.push(`"${campaign.name}" — insights fetch failed: ${err}`)
      }
    }

    // Write cache
    const cache: CacheData = { fetchedAt: new Date().toISOString(), campaigns }
    await writeJSON(cacheKey, cache)

    if (rules.length === 0) {
      log.push(`No rules for this client — skipping rule evaluation`)
      continue
    }

    log.push(`\nEvaluating ${rules.length} rule(s) against ${campaigns.length} campaign(s)`)

    for (const rule of rules) {
      log.push(`\nRule: "${rule.name}" — ${rule.metric} ${rule.operator === "less_than" ? "<" : ">"} ${rule.threshold} for ${rule.windowDays}d → ${rule.action}`)

      const ruleTargets =
        rule.appliesTo === "specific"
          ? campaigns.filter((c) => rule.campaignIds.includes(c.id))
          : campaigns

      for (const campaign of ruleTargets) {
        log.push(`  Campaign: "${campaign.name}" (${campaign.status})`)
        const dailySeries = campaign.insights.dailySeries as unknown as Array<Record<string, number>>

        const conditionMet = evaluateWindow(
          dailySeries,
          rule.metric,
          rule.operator,
          rule.threshold,
          rule.windowDays,
          log,
          rule.metric
        )

        if (!conditionMet) {
          log.push(`  → condition NOT met — no action`)
          continue
        }

        if (rule.action === "pause" && campaign.status === "PAUSED") {
          log.push(`  → condition met but campaign already PAUSED — skipped`)
          continue
        }
        if (rule.action === "resume" && campaign.status === "ACTIVE") {
          log.push(`  → condition met but campaign already ACTIVE — skipped`)
          continue
        }
        if (rule.action === "scale_budget" && campaign.daily_budget === null) {
          log.push(`  → condition met but campaign has lifetime budget — cannot scale`)
          errors.push(`[${label}] Cannot scale budget for ${campaign.name} (lifetime budget)`)
          continue
        }

        const lastDayValue = dailySeries.length > 0
          ? getMetricValue(dailySeries[dailySeries.length - 1], rule.metric)
          : 0

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
          if (rule.action === "pause") {
            await pauseCampaign(campaign.id, token)
            campaign.status = "PAUSED"
            log.push(`  → PAUSED successfully`)
          } else if (rule.action === "resume") {
            await resumeCampaign(campaign.id, token)
            campaign.status = "ACTIVE"
            log.push(`  → RESUMED successfully`)
          } else if (rule.action === "scale_budget" && campaign.daily_budget !== null) {
            const pct = rule.actionValue ?? 0
            const newBudget = Math.round(campaign.daily_budget * (1 + pct / 100))
            await updateDailyBudget(campaign.id, token, newBudget)
            campaign.daily_budget = newBudget
            log.push(`  → budget scaled ${pct > 0 ? "+" : ""}${pct}% → $${(newBudget / 100).toFixed(0)}/day`)
          } else if (rule.action === "notify_only") {
            log.push(`  → notify only — no API action taken`)
          }
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

  // Send email if any actions fired
  if (firedAlerts.length > 0) {
    await sendAlertEmail(firedAlerts, settings)
  }

  await writeSettings({ lastAgentRun: new Date().toISOString() })

  const actionsCount = firedAlerts.filter((a) => a.status === "success").length
  log.push(`\nDone — ${actionsCount} action(s) taken, ${errors.length} error(s)`)

  return {
    success: true,
    actionsCount,
    runId,
    errors,
    log,
  }
}
