import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { readAlerts, readRules } from "@/lib/storage"
import { timeAgo } from "@/lib/utils"
import { PauseCircle, RotateCcw, TrendingUp, Zap, FileText, FolderOpen, CreditCard, MessageSquare } from "lucide-react"
import { getPortalT } from "@/lib/i18n/server"

type TimelineEvent = {
  id: string
  title: string
  description: string
  timestamp: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

const MOCK_EVENTS: TimelineEvent[] = [
  {
    id: "m1",
    title: "Invoice #INV-2025-006 sent",
    description: "Monthly retainer invoice sent — $3,500.00",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    icon: CreditCard,
    iconBg: "bg-purple-100 dark:bg-purple-950/40",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "m2",
    title: "Project milestone reached",
    description: "Q2 Campaign Strategy — Creative brief approved",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    icon: FolderOpen,
    iconBg: "bg-amber-100 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "m3",
    title: "Support ticket resolved",
    description: "#TKT-003 — Campaign not spending resolved",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    icon: MessageSquare,
    iconBg: "bg-teal-100 dark:bg-teal-950/40",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "m4",
    title: "Monthly report delivered",
    description: "May 2025 performance report — PDF + slides",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    icon: FileText,
    iconBg: "bg-zinc-100 dark:bg-zinc-800",
    iconColor: "text-zinc-600 dark:text-zinc-400",
  },
]

function groupByDate(events: TimelineEvent[], todayLabel: string, yesterdayLabel: string) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const groups: Record<string, TimelineEvent[]> = {}
  for (const e of events) {
    const d = new Date(e.timestamp).toDateString()
    const label = d === today ? todayLabel : d === yesterday ? yesterdayLabel : new Date(e.timestamp).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    if (!groups[label]) groups[label] = []
    groups[label].push(e)
  }
  return groups
}

export default async function ActivityPage() {
  const [client, t] = await Promise.all([getUserClient(), getPortalT()])
  if (!client) redirect("/dashboard")

  const ACTION_META = {
    pause: { icon: PauseCircle, iconBg: "bg-red-100 dark:bg-red-950/40", iconColor: "text-red-600 dark:text-red-400", label: t.activity.actions.pause },
    resume: { icon: RotateCcw, iconBg: "bg-emerald-100 dark:bg-emerald-950/40", iconColor: "text-emerald-600 dark:text-emerald-400", label: t.activity.actions.resume },
    scale_budget: { icon: TrendingUp, iconBg: "bg-blue-100 dark:bg-blue-950/40", iconColor: "text-blue-600 dark:text-blue-400", label: t.activity.actions.scale_budget },
    notify_only: { icon: Zap, iconBg: "bg-indigo-100 dark:bg-indigo-950/40", iconColor: "text-indigo-600 dark:text-indigo-400", label: t.activity.actions.notify_only },
  } as const

  const [allAlerts, allRules] = await Promise.all([readAlerts(), readRules()])
  const alertEvents: TimelineEvent[] = allAlerts
    .filter((a) => allRules.some((r) => r.id === a.ruleId && r.clientId === client.id))
    .slice(0, 20)
    .map((a) => {
      const meta = ACTION_META[a.action as keyof typeof ACTION_META] ?? ACTION_META.notify_only
      return {
        id: a.id,
        title: meta.label + " · " + a.campaignName,
        description: `Rule "${a.ruleName}" triggered (${a.metricName}: ${a.metricValue.toFixed(2)})`,
        timestamp: a.timestamp,
        icon: meta.icon,
        iconBg: meta.iconBg,
        iconColor: meta.iconColor,
      }
    })

  const allEvents = [...MOCK_EVENTS, ...alertEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const groups = groupByDate(allEvents, t.activity.today, t.activity.yesterday)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t.activity.heading}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t.activity.subtitle}</p>
      </div>

      <div className="space-y-8">
        {Object.entries(groups).map(([date, events]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{date}</p>
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {events.map((e) => {
                  const Icon = e.icon
                  return (
                    <div key={e.id} className="flex gap-4 relative">
                      <div className={`w-7 h-7 rounded-full ${e.iconBg} flex items-center justify-center shrink-0 z-10 ring-2 ring-background`}>
                        <Icon className={`h-3.5 w-3.5 ${e.iconColor}`} />
                      </div>
                      <div className="flex-1 pt-0.5 pb-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium text-foreground leading-snug">{e.title}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{timeAgo(e.timestamp)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{e.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
