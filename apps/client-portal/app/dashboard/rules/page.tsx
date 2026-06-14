import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { readRules, readAlerts } from "@/lib/storage"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Zap, ShieldCheck, TrendingUp, Bell, PauseCircle, RotateCcw, Info } from "lucide-react"
import { timeAgo } from "@/lib/utils"

const METRIC_LABELS: Record<string, string> = {
  purchase_roas: "ROAS", spend: "Spend", impressions: "Impressions", clicks: "Clicks",
  ctr: "CTR", reach: "Reach", frequency: "Frequency", video_views: "Video Views",
  engagement_rate: "Engagement Rate",
}
const OP_LABELS: Record<string, string> = {
  less_than: "drops below", greater_than: "exceeds", equals: "equals",
}
const ACTION_LABELS: Record<string, string> = {
  pause: "Pause campaign", resume: "Resume campaign",
  scale_budget: "Scale budget", notify_only: "Send notification",
}
const ACTION_VARIANTS: Record<string, "danger" | "success" | "info" | "neutral"> = {
  pause: "danger", resume: "success", scale_budget: "info", notify_only: "neutral",
}
const ACTION_BORDER: Record<string, string> = {
  pause: "border-l-red-500",
  resume: "border-l-emerald-500",
  scale_budget: "border-l-blue-500",
  notify_only: "border-l-indigo-500",
}
const ACTION_ICONS: Record<string, React.ElementType> = {
  pause: PauseCircle,
  resume: RotateCcw,
  scale_budget: TrendingUp,
  notify_only: Bell,
}
const RULE_BENEFITS: Record<string, { headline: string; detail: string }> = {
  pause: {
    headline: "Protects your budget automatically",
    detail: "When campaign performance dips below your threshold, this rule steps in before you'd even notice — stopping wasted spend without you needing to check in daily.",
  },
  resume: {
    headline: "Never misses a recovery window",
    detail: "Paused campaigns can miss optimal moments. This rule re-enables them the moment conditions improve, so your budget is always working when it should be.",
  },
  scale_budget: {
    headline: "Doubles down on what's working",
    detail: "High-performing periods are short-lived. This rule catches them and increases your daily budget automatically, maximising returns while the signal is strong.",
  },
  notify_only: {
    headline: "Keeps you in control, always informed",
    detail: "Not every situation calls for automation. This rule alerts your team the moment a threshold is crossed, so a human can decide the best next move.",
  },
}

export default async function RulesPage() {
  const client = await getUserClient()
  if (!client) redirect("/")

  const [allRules, allAlerts] = await Promise.all([readRules(), readAlerts()])
  const rules = allRules.filter((r) => r.clientId === client.id)
  const enabled = rules.filter((r) => r.enabled)
  const disabled = rules.filter((r) => !r.enabled)

  // Index last-triggered timestamp per rule
  const lastFiredAt: Record<string, string> = {}
  for (const alert of allAlerts) {
    if (!lastFiredAt[alert.ruleId] || alert.timestamp > lastFiredAt[alert.ruleId]) {
      lastFiredAt[alert.ruleId] = alert.timestamp
    }
  }

  if (rules.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div>
          <h2 className="text-xl font-bold text-foreground">Automation Rules</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Rules that automatically manage your campaigns</p>
        </div>
        <EmptyState icon={Zap} title="No rules configured" description="Your account manager will set up automation rules to manage your campaigns automatically." />
      </div>
    )
  }

  function RuleCard({ rule }: { rule: typeof rules[0] }) {
    const metric = METRIC_LABELS[rule.metric] ?? rule.metric
    const op = OP_LABELS[rule.operator] ?? rule.operator
    const action = ACTION_LABELS[rule.action] ?? rule.action
    const actionVariant = ACTION_VARIANTS[rule.action] ?? "neutral"
    const borderColor = ACTION_BORDER[rule.action] ?? "border-l-zinc-500"
    const ActionIcon = ACTION_ICONS[rule.action] ?? Zap
    const benefit = RULE_BENEFITS[rule.action]
    const lastTs = lastFiredAt[rule.id]

    return (
      <div className={`bg-card border border-border border-l-2 ${borderColor} rounded-xl p-5`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${rule.enabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
            <p className="text-sm font-semibold text-foreground">{rule.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge variant={actionVariant}>{action}</StatusBadge>
            <StatusBadge variant={rule.enabled ? "success" : "neutral"} dot>
              {rule.enabled ? "Active" : "Disabled"}
            </StatusBadge>
          </div>
        </div>

        {/* Condition sentence */}
        <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
          If <span className="text-foreground font-medium">{metric}</span>{" "}
          {op}{" "}
          <span className="text-foreground font-medium">{rule.threshold}</span>{" "}
          over <span className="text-foreground font-medium">{rule.windowDays} day{rule.windowDays !== 1 ? "s" : ""}</span>
          {rule.appliesTo === "specific" && rule.campaignIds.length > 0
            ? ` on ${rule.campaignIds.length} campaign${rule.campaignIds.length > 1 ? "s" : ""}`
            : " on all campaigns"
          }
          {rule.action === "scale_budget" && rule.actionValue != null && (
            <> → <span className="text-foreground font-medium">{rule.actionValue > 0 ? "+" : ""}{rule.actionValue}% budget</span></>
          )}
        </p>

        {/* Benefit block */}
        {benefit && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border flex gap-2.5">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground leading-none mb-1">{benefit.headline}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{benefit.detail}</p>
            </div>
          </div>
        )}

        {/* Footer: last triggered + action icon */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ActionIcon className="h-3.5 w-3.5" />
            {lastTs
              ? <span>Last triggered <span className="text-foreground">{timeAgo(lastTs)}</span></span>
              : <span>Never triggered yet</span>
            }
          </div>
          {lastTs && (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Automation Rules</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{rules.length} rule{rules.length !== 1 ? "s" : ""} configured for your account</p>
      </div>

      {enabled.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active ({enabled.length})</p>
          {enabled.map((r) => <RuleCard key={r.id} rule={r} />)}
        </div>
      )}

      {disabled.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disabled ({disabled.length})</p>
          {disabled.map((r) => <RuleCard key={r.id} rule={r} />)}
        </div>
      )}
    </div>
  )
}
