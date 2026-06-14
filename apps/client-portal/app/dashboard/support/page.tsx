import { StatusBadge } from "@/components/ui/status-badge"
import { MessageSquare, Plus } from "lucide-react"

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

const STATUS_MAP = {
  open: { label: "Open", variant: "info" as const },
  "in-progress": { label: "In Progress", variant: "warning" as const },
  resolved: { label: "Resolved", variant: "success" as const },
  closed: { label: "Closed", variant: "neutral" as const },
}

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

export default function SupportPage() {
  const open = TICKETS.filter((t) => t.status === "open" || t.status === "in-progress")
  const closed = TICKETS.filter((t) => t.status === "resolved" || t.status === "closed")

  function TicketRow({ t }: { t: Ticket }) {
    const s = STATUS_MAP[t.status]
    return (
      <div className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors border-t border-border first:border-0 cursor-pointer">
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${PRIORITY_DOTS[t.priority]}`} title={`Priority: ${t.priority}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{t.number}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{t.category}</span>
              </div>
              <p className="text-sm font-medium text-foreground mt-0.5 leading-snug">{t.title}</p>
            </div>
            <StatusBadge variant={s.variant} dot>{s.label}</StatusBadge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Opened {timeAgo(t.created)} · Updated {timeAgo(t.updated)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Support</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{open.length} open ticket{open.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      {open.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open</p>
          </div>
          {open.map((t) => <TicketRow key={t.id} t={t} />)}
        </div>
      )}

      {closed.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Closed</p>
          </div>
          {closed.map((t) => <TicketRow key={t.id} t={t} />)}
        </div>
      )}

      {TICKETS.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No support tickets</p>
          <p className="text-sm text-muted-foreground mt-1">Create a ticket to get help from your account team.</p>
        </div>
      )}
    </div>
  )
}
