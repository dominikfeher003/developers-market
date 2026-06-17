import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { readAlerts, readRules } from "@/lib/storage"
import { timeAgo } from "@/lib/utils"
import { PauseCircle, RotateCcw, TrendingUp, Zap, FileText, FolderOpen, CreditCard, MessageSquare, Send } from "lucide-react"
import { getPortalT } from "@/lib/i18n/server"
import { getDb, invoices, projects, supportTickets, reportLogs, outreachHistory, eq, desc } from "@dm/db"

type TimelineEvent = {
  id: string
  title: string
  description: string
  timestamp: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

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

  // Fetch all real data in parallel
  const db = getDb()
  const [allAlerts, allRules, recentInvoices, recentProjects, recentTickets, recentReports, recentOutreach] = await Promise.all([
    readAlerts().catch(() => [] as Awaited<ReturnType<typeof readAlerts>>),
    readRules().catch(() => [] as Awaited<ReturnType<typeof readRules>>),
    db.select().from(invoices).where(eq(invoices.clientId, client.id)).orderBy(desc(invoices.createdAt)).limit(10).catch(() => []),
    db.select().from(projects).where(eq(projects.clientId, client.id)).orderBy(desc(projects.updatedAt)).limit(10).catch(() => []),
    db.select().from(supportTickets).where(eq(supportTickets.clientId, client.id)).orderBy(desc(supportTickets.updatedAt)).limit(10).catch(() => []),
    db.select().from(reportLogs).where(eq(reportLogs.clientId, client.id)).orderBy(desc(reportLogs.sentAt)).limit(5).catch(() => []),
    db.select().from(outreachHistory).where(eq(outreachHistory.clientId, client.id)).orderBy(desc(outreachHistory.sentAt)).limit(5).catch(() => []),
  ])

  // Alert events (automation rule triggers)
  const alertEvents: TimelineEvent[] = allAlerts
    .filter((a) => allRules.some((r) => r.id === a.ruleId && r.clientId === client.id))
    .slice(0, 15)
    .map((a) => {
      const meta = ACTION_META[a.action as keyof typeof ACTION_META] ?? ACTION_META.notify_only
      return {
        id: a.id,
        title: `${meta.label} · ${a.campaignName}`,
        description: `Rule "${a.ruleName}" triggered (${a.metricName}: ${a.metricValue.toFixed(2)})`,
        timestamp: a.timestamp,
        icon: meta.icon,
        iconBg: meta.iconBg,
        iconColor: meta.iconColor,
      }
    })

  // Invoice events
  const invoiceEvents: TimelineEvent[] = recentInvoices.map((inv) => ({
    id: `inv-${inv.id}`,
    title: `Invoice ${inv.number} · ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}`,
    description: `${inv.description || "Invoice"} — $${(inv.amount / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
    timestamp: inv.createdAt.toISOString(),
    icon: CreditCard,
    iconBg: inv.status === "paid" ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-purple-100 dark:bg-purple-950/40",
    iconColor: inv.status === "paid" ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400",
  }))

  // Project events
  const projectEvents: TimelineEvent[] = recentProjects.map((p) => ({
    id: `proj-${p.id}`,
    title: `Project updated · ${p.name}`,
    description: `${p.status.charAt(0).toUpperCase() + p.status.slice(1).replace("-", " ")} · ${p.progress}% complete`,
    timestamp: p.updatedAt.toISOString(),
    icon: FolderOpen,
    iconBg: "bg-amber-100 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  }))

  // Support ticket events
  const ticketEvents: TimelineEvent[] = recentTickets.map((tk) => ({
    id: `tkt-${tk.id}`,
    title: `${tk.number} · ${tk.title}`,
    description: `Status: ${tk.status.charAt(0).toUpperCase() + tk.status.slice(1).replace("-", " ")} · ${tk.category}`,
    timestamp: tk.updatedAt.toISOString(),
    icon: MessageSquare,
    iconBg: tk.status === "resolved" || tk.status === "closed" ? "bg-teal-100 dark:bg-teal-950/40" : "bg-blue-100 dark:bg-blue-950/40",
    iconColor: tk.status === "resolved" || tk.status === "closed" ? "text-teal-600 dark:text-teal-400" : "text-blue-600 dark:text-blue-400",
  }))

  // Report events
  const reportEvents: TimelineEvent[] = recentReports.map((r) => ({
    id: `rpt-${r.id}`,
    title: "Performance report delivered",
    description: `${r.reportType.charAt(0).toUpperCase() + r.reportType.slice(1)} report sent`,
    timestamp: r.sentAt.toISOString(),
    icon: FileText,
    iconBg: "bg-zinc-100 dark:bg-zinc-800",
    iconColor: "text-zinc-600 dark:text-zinc-400",
  }))

  // Outreach events
  const outreachEvents: TimelineEvent[] = recentOutreach.map((o) => ({
    id: `out-${o.id}`,
    title: `Outreach email sent`,
    description: `To ${o.toName || o.toEmail} — "${o.subject}"`,
    timestamp: o.sentAt,
    icon: Send,
    iconBg: "bg-indigo-100 dark:bg-indigo-950/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  }))

  const allEvents = [
    ...alertEvents,
    ...invoiceEvents,
    ...projectEvents,
    ...ticketEvents,
    ...reportEvents,
    ...outreachEvents,
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const groups = groupByDate(allEvents, t.activity.today, t.activity.yesterday)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t.activity.heading}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t.activity.subtitle}</p>
      </div>

      {allEvents.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No activity yet</p>
          <p className="text-sm text-muted-foreground mt-1">Automation triggers, invoices, projects, and support tickets will appear here.</p>
        </div>
      ) : (
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
      )}
    </div>
  )
}
