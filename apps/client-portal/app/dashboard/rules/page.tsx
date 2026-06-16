import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { readRules, readAlerts } from "@/lib/storage"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Zap, ShieldCheck, TrendingUp, Bell, PauseCircle, RotateCcw, Info } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import { getPortalT } from "@/lib/i18n/server"
import { tr } from "@/lib/i18n/en"

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

export default async function RulesPage() {
  const [client, t] = await Promise.all([getUserClient(), getPortalT()])
  if (!client) redirect("/")

  const [allRules, allAlerts] = await Promise.all([readRules(), readAlerts()])
  const rules = allRules.filter((r) => r.clientId === client.id)
  const enabled = rules.filter((r) => r.enabled)
  const disabled = rules.filter((r) => !r.enabled)

  const METRIC_LABELS: Record<string, string> = t.rules.metrics
  const OP_LABELS: Record<string, string> = t.rules.operators
  const ACTION_LABELS: Record<string, string> = t.rules.actions
  const RULE_BENEFITS: Record<string, { headline: string; detail: string }> = t.rules.benefits

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
          <h2 className="text-xl font-bold text-foreground">{t.rules.heading}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t.rules.subtitle}</p>
        </div>
        <EmptyState icon={Zap} title={t.rules.noRules} description={t.rules.noRulesDesc} />
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
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${rule.enabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
            <p className="text-sm font-semibold text-foreground">{rule.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge variant={actionVariant}>{action}</StatusBadge>
            <StatusBadge variant={rule.enabled ? "success" : "neutral"} dot>
              {rule.enabled ? t.rules.statusActive : t.rules.statusDisabled}
            </StatusBadge>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
          {t.rules.if} <span className="text-foreground font-medium">{metric}</span>{" "}
          {op}{" "}
          <span className="text-foreground font-medium">{rule.threshold}</span>{" "}
          {t.rules.over} <span className="text-foreground font-medium">{rule.windowDays} {rule.windowDays !== 1 ? t.rules.days : t.rules.day}</span>
          {rule.appliesTo === "specific" && rule.campaignIds.length > 0
            ? ` ${t.rules.on} ${rule.campaignIds.length} ${rule.campaignIds.length > 1 ? t.rules.campaigns : t.rules.campaign}`
            : ` ${t.rules.onAllCampaigns}`
          }
          {rule.action === "scale_budget" && rule.actionValue != null && (
            <> → <span className="text-foreground font-medium">{rule.actionValue > 0 ? "+" : ""}{rule.actionValue}% budget</span></>
          )}
        </p>

        {benefit && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border flex gap-2.5">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground leading-none mb-1">{benefit.headline}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{benefit.detail}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ActionIcon className="h-3.5 w-3.5" />
            {lastTs
              ? <span>{t.rules.lastTriggered} <span className="text-foreground">{timeAgo(lastTs)}</span></span>
              : <span>{t.rules.neverTriggered}</span>
            }
          </div>
          {lastTs && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
        </div>
      </div>
    )
  }

  const rulesCountStr = rules.length === 1
    ? tr(t.rules.count1, { n: rules.length })
    : tr(t.rules.countN, { n: rules.length })

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t.rules.heading}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{rulesCountStr}</p>
      </div>

      {enabled.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {tr(t.rules.sectionActive, { n: enabled.length })}
          </p>
          {enabled.map((r) => <RuleCard key={r.id} rule={r} />)}
        </div>
      )}

      {disabled.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {tr(t.rules.sectionDisabled, { n: disabled.length })}
          </p>
          {disabled.map((r) => <RuleCard key={r.id} rule={r} />)}
        </div>
      )}
    </div>
  )
}
