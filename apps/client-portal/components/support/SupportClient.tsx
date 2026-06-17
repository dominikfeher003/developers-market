"use client"

import { useState } from "react"
import { Plus, MessageSquare, ChevronLeft, Send, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PortalTranslations } from "@/lib/i18n/en"

interface TicketMessage {
  role: "client" | "agent"
  content: string
  sentAt: string
  authorName: string
}

interface Ticket {
  id: string
  number: string
  title: string
  category: string
  status: string
  priority: string
  messages: unknown
  createdAt: Date
  updatedAt: Date
}

const PRIORITY_DOTS: Record<string, string> = {
  low: "bg-zinc-400",
  medium: "bg-amber-400",
  high: "bg-orange-500",
  urgent: "bg-red-500",
}

const STATUS_VARIANTS: Record<string, { label: string; className: string }> = {
  "open": { label: "Open", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  "in-progress": { label: "In Progress", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  "resolved": { label: "Resolved", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  "closed": { label: "Closed", className: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20" },
}

function timeAgo(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const CATEGORIES = ["General", "Performance", "Budget", "Technical", "Creative", "Billing", "Other"]
const PRIORITIES = ["low", "medium", "high", "urgent"] as const

interface Props {
  initialTickets: Ticket[]
  t: PortalTranslations
}

export function SupportClient({ initialTickets, t }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newCategory, setNewCategory] = useState("General")
  const [newPriority, setNewPriority] = useState<typeof PRIORITIES[number]>("medium")
  const [newMessage, setNewMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replying, setReplying] = useState(false)

  const statusDef = (s: string) => STATUS_VARIANTS[s] ?? STATUS_VARIANTS["open"]
  const open = tickets.filter((t) => t.status === "open" || t.status === "in-progress")
  const closed = tickets.filter((t) => t.status === "resolved" || t.status === "closed")
  const messages = (selected?.messages ?? []) as TicketMessage[]

  async function submitTicket() {
    if (!newTitle.trim() || !newMessage.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, category: newCategory, priority: newPriority, message: newMessage }),
      })
      const data = await res.json() as { id?: string; error?: string }
      if (data.error) { alert(data.error); return }

      // Reload tickets
      const listRes = await fetch("/api/support/tickets")
      const listData = await listRes.json() as { tickets: Ticket[] }
      setTickets(listData.tickets)
      setShowNew(false)
      setNewTitle(""); setNewCategory("General"); setNewPriority("medium"); setNewMessage("")
    } catch { /* ignore */ } finally {
      setSubmitting(false)
    }
  }

  async function sendReply() {
    if (!selected || !replyText.trim()) return
    setReplying(true)
    try {
      await fetch(`/api/support/tickets/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      })
      const res = await fetch(`/api/support/tickets/${selected.id}`)
      const data = await res.json() as { ticket: Ticket }
      setSelected(data.ticket)
      setTickets((prev) => prev.map((t) => t.id === data.ticket.id ? data.ticket : t))
      setReplyText("")
    } catch { /* ignore */ } finally {
      setReplying(false)
    }
  }

  function TicketRow({ ticket }: { ticket: Ticket }) {
    const sd = statusDef(ticket.status)
    return (
      <div
        onClick={() => setSelected(ticket)}
        className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors border-t border-border first:border-0 cursor-pointer"
      >
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${PRIORITY_DOTS[ticket.priority] ?? "bg-zinc-400"}`} title={`Priority: ${ticket.priority}`} />
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
            <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", sd.className)}>{sd.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {t.support.opened} {timeAgo(ticket.createdAt)} · {t.support.updated} {timeAgo(ticket.updatedAt)}
          </p>
        </div>
      </div>
    )
  }

  // Thread view
  if (selected) {
    const sd = statusDef(selected.status)
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to tickets
        </button>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{selected.number}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{selected.category}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{selected.title}</h3>
            </div>
            <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 mt-1", sd.className)}>{sd.label}</span>
          </div>

          <div className="p-5 space-y-4 min-h-[200px]">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "client" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  msg.role === "client" ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {msg.authorName?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className={cn("max-w-[80%]", msg.role === "client" ? "items-end" : "items-start", "flex flex-col gap-1")}>
                  <div className={cn(
                    "text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl",
                    msg.role === "client"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">{timeAgo(msg.sentAt)}</p>
                </div>
              </div>
            ))}
          </div>

          {(selected.status === "open" || selected.status === "in-progress") && (
            <div className="border-t border-border p-3 flex gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder="Write a reply..."
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
          )}
        </div>
      </div>
    )
  }

  // New Ticket Modal
  const modal = showNew && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">New Support Ticket</h3>
          <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subject</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Briefly describe your issue"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as typeof PRIORITIES[number])}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Message</label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={4}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-indigo-500 resize-none transition-colors"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => setShowNew(false)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitTicket}
              disabled={submitting || !newTitle.trim() || !newMessage.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Submit Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {modal}
      <div className="flex justify-end">
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
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

      {tickets.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">{t.support.noTickets}</p>
          <p className="text-sm text-muted-foreground mt-1">{t.support.noTicketsDesc}</p>
        </div>
      )}
    </>
  )
}
