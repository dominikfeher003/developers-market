import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { readAlerts, readRules } from "@/lib/storage"
import { timeAgo } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { Bell, PauseCircle, RotateCcw, TrendingUp, Zap } from "lucide-react"
import { getPortalT } from "@/lib/i18n/server"
import { tr } from "@/lib/i18n/en"

export default async function NotificationsPage() {
  const [client, t] = await Promise.all([getUserClient(), getPortalT()])
  if (!client) redirect("/dashboard")

  const ACTION_META = {
    pause: { label: t.notifications.actions.pause, icon: PauseCircle, color: "bg-red-500", border: "border-l-red-400" },
    resume: { label: t.notifications.actions.resume, icon: RotateCcw, color: "bg-emerald-500", border: "border-l-emerald-400" },
    scale_budget: { label: t.notifications.actions.scale_budget, icon: TrendingUp, color: "bg-blue-500", border: "border-l-blue-400" },
    notify_only: { label: t.notifications.actions.notify_only, icon: Zap, color: "bg-indigo-500", border: "border-l-indigo-400" },
  } as const

  const [allAlerts, allRules] = await Promise.all([readAlerts(), readRules()])
  const alerts = allAlerts
    .filter((a) => allRules.some((r) => r.id === a.ruleId && r.clientId === client.id))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 100)

  const countStr = alerts.length === 1
    ? tr(t.notifications.count1, { n: alerts.length })
    : tr(t.notifications.countN, { n: alerts.length })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.notifications.heading}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{countStr}</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <EmptyState icon={Bell} title={t.notifications.noAlerts} description={t.notifications.noAlertsDesc} />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {alerts.map((a, idx) => {
            const meta = ACTION_META[a.action as keyof typeof ACTION_META] ?? ACTION_META.notify_only
            const Icon = meta.icon
            return (
              <div key={a.id} className={`flex items-start gap-4 px-5 py-4 border-l-2 ${meta.border} ${idx > 0 ? "border-t border-t-border" : ""} hover:bg-muted/30 transition-colors`}>
                <div className={`w-7 h-7 rounded-full ${meta.color}/15 flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`h-3.5 w-3.5 ${meta.color.replace("bg-", "text-")}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{meta.label}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.timestamp)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{a.campaignName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rule: {a.ruleName} · {a.metricName}: {a.metricValue.toFixed(2)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
