import { StatusBadge } from "@/components/ui/status-badge"
import { MessageSquare, Plus } from "lucide-react"
import { getPortalT } from "@/lib/i18n/server"
import { tr } from "@/lib/i18n/en"

type Ticket = {
  id: string
  number: string
  title: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  created: string
  updated: string
  category: string
}

const TICKETS: Ticket[] = [
  {
    id: "t1", number: "TKT-005",
    title: "ROAS dropped significantly this week — need analysis",
    status: "open", priority: "high",
    created: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updated: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    category: "Performance",
  },
  {
    id: "t2", number: "TKT-004",
    title: "Can we increase budget for the summer sale campaign?",
    status: "in-progress", priority: "medium",
    created: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    category: "Budget",
  },
  {
    id: "t3", number: "TKT-003",
    title: "Campaign not spending full daily budget",
    status: "resolved", priority: "medium",
    created: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updated: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    category: "Technical",
  },
  {
    id: "t4", number: "TKT-002",
    title: "Need new creative assets for product launch",
    status: "resolved", priority: "low",
    created: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updated: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    category: "Creative",
  },
  {
    id: "t5", number: "TKT-001",
    title: "Initial account setup and pixel installation",
    status: "closed", priority: "urgent",
    created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
    category: "Technical",
  },
]

const PRIORITY_DOTS: Record<Ticket["priority"], string> = {
  low: "bg-zinc-400",
  medium: "bg-amber-400",
  high: "bg-orange-500",
  urgent: "bg-red-500",
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function SupportPage() {
  const t = await getPortalT()

  const STATUS_MAP = {
    open: { label: t.support.status.open, variant: "info" as const },
    "in-progress": { label: t.support.status.inProgress, variant: "warning" as const },
    resolved: { label: t.support.status.resolved, variant: "success" as const },
    closed: { label: t.support.status.closed, variant: "neutral" as const },
  }

  const open = TICKETS.filter((t) => t.status === "open" || t.status === "in-progress")
  const closed = TICKETS.filter((t) => t.status === "resolved" || t.status === "closed")

  const openCountStr = open.length === 1
    ? tr(t.support.count1, { n: open.length })
    : tr(t.support.countN, { n: open.length })

  function TicketRow({ ticket }: { ticket: Ticket }) {
    const s = STATUS_MAP[ticket.status]
    return (
      <div className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors border-t border-border first:border-0 cursor-pointer">
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${PRIORITY_DOTS[ticket.priority]}`} title={`Priority: ${ticket.priority}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{ticket.number}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{ticket.category}</span>
              </div>
              <p className="text-sm font-medium text-foreground mt-0.5 leading-snug">{ticket.title}</p>
            </div>
            <StatusBadge variant={s.variant} dot>{s.label}</StatusBadge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {t.support.opened} {timeAgo(ticket.created)} · {t.support.updated} {timeAgo(ticket.updated)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.support.heading}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{openCountStr}</p>
        </div>
        <button className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" />
          {t.support.newTicket}
        </button>
      </div>

      {open.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.support.sectionOpen}</p>
          </div>
          {open.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}
        </div>
      )}

      {closed.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.support.sectionClosed}</p>
          </div>
          {closed.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}
        </div>
      )}

      {TICKETS.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">{t.support.noTickets}</p>
          <p className="text-sm text-muted-foreground mt-1">{t.support.noTicketsDesc}</p>
        </div>
      )}
    </div>
  )
}
