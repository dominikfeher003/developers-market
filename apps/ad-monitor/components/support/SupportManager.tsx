"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, ChevronLeft, Send, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface TicketMessage {
  role: "client" | "agent"
  content: string
  sentAt: string
  authorName: string
}

interface Ticket {
  id: string
  clientId: string
  clientName?: string
  number: string
  title: string
  category: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  messages: TicketMessage[]
  createdAt: string
  updatedAt: string
}

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-zinc-400", medium: "bg-amber-400", high: "bg-orange-500", urgent: "bg-red-500",
}
const STATUS_COLORS: Record<string, string> = {
  "open": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "in-progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "resolved": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "closed": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
}

function timeAgo(s: string) {
  const diff = Date.now() - new Date(s).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function SupportManager() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replying, setReplying] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/support-tickets")
    const data = await res.json() as { tickets: Ticket[] }
    setTickets(data.tickets ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function sendReply() {
    if (!selected || !replyText.trim()) return
    setReplying(true)
    try {
      await fetch(`/api/support-tickets/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      })
      const res = await fetch(`/api/support-tickets/${selected.id}`)
      const data = await res.json() as { ticket: Ticket }
      setSelected(data.ticket)
      setTickets((prev) => prev.map((t) => t.id === data.ticket.id ? data.ticket : t))
      setReplyText("")
    } finally { setReplying(false) }
  }

  async function setStatus(status: string) {
    if (!selected) return
    setStatusUpdating(true)
    try {
      await fetch(`/api/support-tickets/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const res = await fetch(`/api/support-tickets/${selected.id}`)
      const data = await res.json() as { ticket: Ticket }
      setSelected(data.ticket)
      setTickets((prev) => prev.map((t) => t.id === data.ticket.id ? data.ticket : t))
    } finally { setStatusUpdating(false) }
  }

  const open = tickets.filter((t) => t.status === "open" || t.status === "in-progress")
  const closed = tickets.filter((t) => t.status === "resolved" || t.status === "closed")

  function TicketRow({ ticket }: { ticket: Ticket }) {
    return (
      <div
        onClick={() => setSelected(ticket)}
        className="flex items-start gap-3 px-5 py-4 border-t border-border first:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${PRIORITY_DOT[ticket.priority] ?? "bg-zinc-400"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono text-muted-foreground">{ticket.number}</span>
            {ticket.clientName && <span className="text-xs text-muted-foreground">· {ticket.clientName}</span>}
            <span className="text-xs text-muted-foreground">· {ticket.category}</span>
          </div>
          <p className="text-sm font-medium text-foreground leading-snug">{ticket.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo(ticket.updatedAt)}</p>
        </div>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 mt-1 ${STATUS_COLORS[ticket.status]}`}>
          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace("-", " ")}
        </span>
      </div>
    )
  }

  if (selected) {
    const messages = (selected.messages ?? []) as TicketMessage[]
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to tickets
          </button>
          <button onClick={load} className="text-zinc-400 hover:text-foreground transition-colors p-1.5 rounded hover:bg-muted">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{selected.number}</span>
                {selected.clientName && <span className="text-xs text-muted-foreground">· {selected.clientName}</span>}
                <span className="text-xs text-muted-foreground">· {selected.category} · <span className="capitalize">{selected.priority}</span> priority</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{selected.title}</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selected.status}
                disabled={statusUpdating}
                onChange={(e) => setStatus(e.target.value)}
                className="text-xs bg-muted border border-border rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="p-5 space-y-4 min-h-[200px]">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "agent" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  msg.role === "agent" ? "bg-indigo-600 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-foreground"
                )}>
                  {msg.authorName?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className={cn("max-w-[80%] flex flex-col gap-1", msg.role === "agent" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "text-sm px-3.5 py-2.5 rounded-2xl leading-relaxed",
                    msg.role === "agent" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                  )}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">{msg.authorName} · {timeAgo(msg.sentAt)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3 flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply() } }}
              placeholder="Write a reply as Developer's Market..."
              rows={1}
              className="flex-1 bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-indigo-500 resize-none [field-sizing:content] max-h-32 transition-colors"
            />
            <button
              onClick={sendReply}
              disabled={replying || !replyText.trim()}
              className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl transition-colors shrink-0"
            >
              {replying ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""} total</p>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-foreground transition-colors p-1.5 rounded hover:bg-muted">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 border-2 border-dashed rounded-lg">
          <p className="font-medium text-foreground">No tickets yet</p>
          <p className="text-sm mt-1">Client support requests will appear here.</p>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open ({open.length})</p>
              </div>
              {open.map((t) => <TicketRow key={t.id} ticket={t} />)}
            </div>
          )}
          {closed.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Closed ({closed.length})</p>
              </div>
              {closed.map((t) => <TicketRow key={t.id} ticket={t} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
