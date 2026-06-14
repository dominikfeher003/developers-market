"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Papa from "papaparse"
import { PotentialClient } from "@/lib/types"
import {
  Upload, Loader2, Send, Trash2, CheckCircle2, XCircle,
  Calendar, ChevronDown, ChevronUp, Pencil, SkipForward, Plus, AtSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { LANGUAGES } from "@/lib/languages"

type Filter = "all" | "today" | "pending" | "sent" | "skipped"

// ---- CSV parsing (reuses logic from OutreachClient) ----
const EMAIL_HINTS = ["email", "email address", "work email", "primary email", "e-mail", "mail"]
const FIRST_HINTS = ["first name", "firstname", "first_name", "given name"]
const LAST_HINTS = ["last name", "lastname", "last_name", "surname", "family name"]
const FULL_HINTS = ["name", "full name", "full_name", "contact name", "contact"]
const TITLE_HINTS = ["title", "job title", "position", "role"]
const COMPANY_HINTS = ["company", "company name", "account name", "organization", "organisation", "employer", "business"]
const WEBSITE_HINTS = ["website", "company website", "url", "web", "domain", "homepage"]

function matchCol(rawKeys: string[], normKeys: string[], hints: string[]): string | null {
  const idx = normKeys.indexOf(hints.find(h => normKeys.includes(h)) ?? "")
  if (idx !== -1) return rawKeys[idx]
  const pidx = normKeys.findIndex(k => hints.some(h => k.includes(h) || h.includes(k)))
  return pidx !== -1 ? rawKeys[pidx] : null
}

interface ParsedLead {
  firstName: string; lastName: string; email: string
  title: string; company: string; website: string
}

function parseCSV(file: File): Promise<{ leads: ParsedLead[]; error?: string }> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data as Record<string, string>[]
        if (rows.length === 0) return resolve({ leads: [], error: "CSV is empty" })

        const rawKeys = Object.keys(rows[0])
        const normKeys = rawKeys.map(k => k.replace(/^﻿/, "").trim().toLowerCase().replace(/\s+/g, " "))
        const g = (col: string | null, row: Record<string, string>) => col ? row[col]?.trim() ?? "" : ""

        let emailCol = matchCol(rawKeys, normKeys, EMAIL_HINTS)
        if (emailCol) {
          const n = emailCol.trim().toLowerCase()
          if (n.includes("company") || n.includes("domain")) emailCol = null
        }
        if (!emailCol) {
          for (const key of rawKeys) {
            const vals = rows.slice(0, 10).map(r => r[key]?.trim() ?? "")
            if (vals.filter(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)).length >= Math.min(2, vals.filter(Boolean).length)) {
              emailCol = key; break
            }
          }
        }
        if (!emailCol) return resolve({ leads: [], error: `No email column found. Columns: ${rawKeys.join(", ")}` })

        const firstCol = matchCol(rawKeys, normKeys, FIRST_HINTS)
        const lastCol = matchCol(rawKeys, normKeys, LAST_HINTS)
        const fullCol = matchCol(rawKeys, normKeys, FULL_HINTS)
        const titleCol = matchCol(rawKeys, normKeys, TITLE_HINTS)
        const companyCol = matchCol(rawKeys, normKeys, COMPANY_HINTS)
        const websiteCol = matchCol(rawKeys, normKeys, WEBSITE_HINTS)

        const leads: ParsedLead[] = rows
          .map((row) => {
            const email = g(emailCol, row)
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
            let firstName = g(firstCol, row)
            let lastName = g(lastCol, row)
            if (!firstName && !lastName && fullCol) {
              const parts = g(fullCol, row).split(/\s+/)
              firstName = parts[0] ?? ""; lastName = parts.slice(1).join(" ")
            }
            if (!firstName) {
              const local = email.split("@")[0].replace(/[._\-+]/g, " ").trim()
              firstName = local.split(" ")[0] ?? ""
              firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
            }
            return { firstName, lastName, email, title: g(titleCol, row), company: g(companyCol, row), website: g(websiteCol, row) }
          })
          .filter((l): l is ParsedLead => l !== null)

        if (leads.length === 0) return resolve({ leads: [], error: "No valid email addresses found in CSV" })
        resolve({ leads })
      },
    })
  })
}

// ---- Send preview panel ----
interface SendPanelProps {
  client: PotentialClient
  onSent: () => void
  onCancel: () => void
}

function SendPanel({ client, onSent, onCancel }: SendPanelProps) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [genStatus, setGenStatus] = useState<"idle" | "generating" | "ready" | "error">("idle")
  const [genError, setGenError] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState("")
  const [lang, setLang] = useState(client.language || "English")

  function generate(selectedLang: string) {
    setGenStatus("generating")
    setGenError("")
    fetch("/api/outreach/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: client.firstName,
        lastName: client.lastName,
        title: client.title,
        company: client.company,
        website: client.website,
        language: selectedLang,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setGenError(data.error); setGenStatus("error") }
        else { setSubject(data.subject ?? ""); setBody(data.body ?? ""); setGenStatus("ready") }
      })
      .catch(err => { setGenError(String(err)); setGenStatus("error") })
  }

  useEffect(() => {
    generate(lang)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function send() {
    setSending(true)
    setSendError("")
    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: client.email, toName: `${client.firstName} ${client.lastName}`.trim(), company: client.company, subject, body }),
      })
      const data = await res.json()
      if (data.success) {
        await fetch(`/api/outreach/leads/${client.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "sent", sentAt: new Date().toISOString() }),
        })
        onSent()
      } else {
        setSendError(data.error ?? "Send failed")
      }
    } catch (err) {
      setSendError(String(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t border-zinc-200 bg-zinc-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 shrink-0">Language:</span>
        <select
          value={lang}
          onChange={e => { setLang(e.target.value); generate(e.target.value) }}
          disabled={genStatus === "generating"}
          className="text-xs border border-zinc-200 rounded-md px-2 py-1 bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50"
        >
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {genStatus === "generating" && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
        {genStatus === "ready" && (
          <button
            onClick={() => generate(lang)}
            className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2"
          >
            Regenerate
          </button>
        )}
      </div>
      {genStatus === "generating" && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating email…
        </div>
      )}
      {genStatus === "error" && (
        <div className="text-sm text-red-500">{genError}</div>
      )}
      {genStatus === "ready" && (
        <>
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1 block">Subject</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} className="text-sm h-8" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1 block">Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={7}
              className="w-full border border-zinc-200 rounded-md text-sm p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white"
            />
          </div>
          {sendError && <p className="text-xs text-red-500">{sendError}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={send} disabled={sending || !subject || !body} className="gap-1.5">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? "Sending…" : "Send"}
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </>
      )}
    </div>
  )
}

// ---- Main component ----
export function PotentialClients() {
  const [clients, setClients] = useState<PotentialClient[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState("")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ firstName: "", lastName: "", email: "", title: "", company: "", website: "", country: "", language: "English" })
  const [addSaving, setAddSaving] = useState(false)
  const [emailSearch, setEmailSearch] = useState<Map<string, { status: "searching" | "found" | "none"; emails: string[] }>>(new Map())
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/outreach/leads")
    const data = await res.json()
    setClients(data.clients ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const todayStr = new Date().toISOString().slice(0, 10)

  const filtered = clients.filter(c => {
    if (filter === "pending") return c.status === "pending"
    if (filter === "sent") return c.status === "sent"
    if (filter === "skipped") return c.status === "skipped"
    if (filter === "today") return c.status === "pending" && c.scheduledFor?.slice(0, 10) === todayStr
    return true
  })

  const counts = {
    all: clients.length,
    today: clients.filter(c => c.status === "pending" && c.scheduledFor?.slice(0, 10) === todayStr).length,
    pending: clients.filter(c => c.status === "pending").length,
    sent: clients.filter(c => c.status === "sent").length,
    skipped: clients.filter(c => c.status === "skipped").length,
  }

  async function handleCSV(file: File) {
    setUploadError(null)
    setUploading(true)
    const { leads, error } = await parseCSV(file)
    if (error) { setUploadError(error); setUploading(false); return }
    const res = await fetch("/api/outreach/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads }),
    })
    const data = await res.json()
    if (data.error) setUploadError(data.error)
    else setUploadError(data.skipped > 0 ? `Added ${data.added}, skipped ${data.skipped} duplicates` : null)
    await load()
    setUploading(false)
  }

  async function updateStatus(id: string, status: PotentialClient["status"]) {
    await fetch(`/api/outreach/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  async function deleteClient(id: string) {
    await fetch(`/api/outreach/leads/${id}`, { method: "DELETE" })
    setClients(prev => prev.filter(c => c.id !== id))
  }

  async function saveSchedule(id: string) {
    await fetch(`/api/outreach/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledFor: scheduleDate || null }),
    })
    setClients(prev => prev.map(c => c.id === id ? { ...c, scheduledFor: scheduleDate || null } : c))
    setSchedulingId(null)
  }

  async function findEmail(id: string, website: string) {
    setEmailSearch(prev => new Map(prev).set(id, { status: "searching", emails: [] }))
    try {
      const res = await fetch("/api/outreach/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website }),
      })
      const data = await res.json()
      const emails: string[] = data.emails ?? []
      setEmailSearch(prev => new Map(prev).set(id, { status: emails.length > 0 ? "found" : "none", emails }))
    } catch {
      setEmailSearch(prev => new Map(prev).set(id, { status: "none", emails: [] }))
    }
  }

  async function saveFoundEmail(id: string, email: string) {
    await fetch(`/api/outreach/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setClients(prev => prev.map(c => c.id === id ? { ...c, email } : c))
    setEmailSearch(prev => { const m = new Map(prev); m.delete(id); return m })
  }

  async function addManually() {
    if (!addForm.email) return
    setAddSaving(true)
    const res = await fetch("/api/outreach/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    })
    const data = await res.json()
    if (data.client) {
      setClients(prev => [...prev, data.client])
      setAddForm({ firstName: "", lastName: "", email: "", title: "", company: "", website: "", country: "", language: "English" })
      setShowAdd(false)
    }
    setAddSaving(false)
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "today", label: "Due Today" },
    { key: "pending", label: "Pending" },
    { key: "sent", label: "Sent" },
    { key: "skipped", label: "Skipped" },
  ]

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Importing…" : "Upload CSV"}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAdd(v => !v)}>
          <Plus className="h-3.5 w-3.5" /> Add manually
        </Button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCSV(f); e.target.value = "" }} />
        {uploadError && (
          <span className={cn("text-xs ml-1", uploadError.startsWith("Added") ? "text-zinc-500" : "text-red-500")}>{uploadError}</span>
        )}
      </div>

      {/* Manual add form */}
      {showAdd && (
        <div className="border rounded-lg p-4 bg-white space-y-3 max-w-xl">
          <p className="text-sm font-medium">Add potential client</p>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="First name" value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} />
            <Input placeholder="Last name" value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
          <Input placeholder="Email *" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
          <Input placeholder="Title" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
          <Input placeholder="Company" value={addForm.company} onChange={e => setAddForm(f => ({ ...f, company: e.target.value }))} />
          <Input placeholder="Website" value={addForm.website} onChange={e => setAddForm(f => ({ ...f, website: e.target.value }))} />
          <Input placeholder="Country" value={addForm.country} onChange={e => setAddForm(f => ({ ...f, country: e.target.value }))} />
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Email language</Label>
            <select
              value={addForm.language}
              onChange={e => setAddForm(f => ({ ...f, language: e.target.value }))}
              className="w-full text-sm border border-zinc-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addManually} disabled={addSaving || !addForm.email}>{addSaving ? "Saving…" : "Add"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors",
              filter === key
                ? "border-zinc-800 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            )}
          >
            {label}
            {counts[key] > 0 && (
              <span className={cn("ml-1.5 px-1.5 py-0.5 rounded-full text-xs", filter === key ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500")}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 border-2 border-dashed rounded-lg">
          {clients.length === 0 ? (
            <>
              <p className="font-medium text-zinc-600">No potential clients yet</p>
              <p className="text-sm mt-1">Upload a CSV or add manually to build your outreach pipeline.</p>
            </>
          ) : (
            <p className="text-zinc-500">No clients match this filter</p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(client => {
            const isSending = sendingId === client.id
            const isScheduling = schedulingId === client.id
            const isOverdue = client.scheduledFor && client.scheduledFor.slice(0, 10) < todayStr && client.status === "pending"
            const isDueToday = client.scheduledFor?.slice(0, 10) === todayStr && client.status === "pending"

            return (
              <div key={client.id} className="border rounded-lg bg-white overflow-hidden">
                <div className="flex items-start gap-3 px-4 py-3">
                  {/* Status dot */}
                  <div className="mt-0.5 shrink-0">
                    {client.status === "sent" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {client.status === "skipped" && <XCircle className="h-4 w-4 text-zinc-300" />}
                    {client.status === "pending" && (
                      <div className={cn("h-2.5 w-2.5 rounded-full mt-0.5", isDueToday ? "bg-amber-400" : isOverdue ? "bg-red-400" : "bg-zinc-300")} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {client.firstName} {client.lastName}
                      </span>
                      {client.company && (
                        <span className="text-xs text-zinc-400">{client.title ? `${client.title} @ ` : ""}{client.company}</span>
                      )}
                    {client.country && (
                        <span className="text-xs text-zinc-400">· {client.country}</span>
                      )}
                    </div>
                    {client.email ? (
                      <p className="text-xs text-zinc-400 mt-0.5">{client.email}</p>
                    ) : (
                      <div className="mt-0.5">
                        {(() => {
                          const es = emailSearch.get(client.id)
                          if (es?.status === "searching") {
                            return (
                              <span className="flex items-center gap-1 text-xs text-zinc-400 italic">
                                <Loader2 className="h-3 w-3 animate-spin" /> Searching for email…
                              </span>
                            )
                          }
                          if (es?.status === "found") {
                            return (
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                <span className="text-xs text-zinc-400">Found:</span>
                                {es.emails.map(email => (
                                  <button
                                    key={email}
                                    onClick={() => saveFoundEmail(client.id, email)}
                                    className="text-xs text-indigo-600 hover:text-indigo-500 hover:underline font-medium"
                                  >
                                    {email}
                                  </button>
                                ))}
                              </div>
                            )
                          }
                          if (es?.status === "none") {
                            return (
                              <span className="text-xs text-zinc-300 italic">
                                no email found
                                {client.website && (
                                  <button onClick={() => findEmail(client.id, client.website)} className="ml-1.5 text-zinc-400 hover:text-zinc-600 not-italic underline underline-offset-2">retry</button>
                                )}
                              </span>
                            )
                          }
                          return (
                            <span className="flex items-center gap-1.5 text-xs text-zinc-300 italic">
                              no email
                              {client.website && (
                                <button
                                  onClick={() => findEmail(client.id, client.website)}
                                  className="flex items-center gap-0.5 not-italic text-zinc-400 hover:text-indigo-600 transition-colors"
                                  title="Try to find email on website"
                                >
                                  <AtSign className="h-3 w-3" />
                                  Find email
                                </button>
                              )}
                            </span>
                          )
                        })()}
                      </div>
                    )}

                    {/* Schedule display */}
                    {isScheduling ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={e => setScheduleDate(e.target.value)}
                          className="text-xs border border-zinc-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                        <button onClick={() => saveSchedule(client.id)} className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">Save</button>
                        <button onClick={() => setSchedulingId(null)} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
                      </div>
                    ) : client.scheduledFor ? (
                      <button
                        onClick={() => { setSchedulingId(client.id); setScheduleDate(client.scheduledFor?.slice(0, 10) ?? "") }}
                        className={cn(
                          "flex items-center gap-1 text-xs mt-1.5",
                          isOverdue ? "text-red-500" : isDueToday ? "text-amber-500 font-medium" : "text-zinc-400 hover:text-zinc-600"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        {isDueToday ? "Due today" : isOverdue ? `Overdue — ${client.scheduledFor.slice(0, 10)}` : client.scheduledFor.slice(0, 10)}
                        <Pencil className="h-2.5 w-2.5 ml-0.5" />
                      </button>
                    ) : client.status === "sent" && client.sentAt ? (
                      <p className="text-xs text-zinc-400 mt-1">Sent {new Date(client.sentAt).toLocaleDateString()}</p>
                    ) : null}
                  </div>

                  {/* Actions */}
                  {client.status === "pending" && (
                    <div className="flex items-center gap-1 shrink-0">
                      {!client.scheduledFor && (
                        <button
                          onClick={() => { setSchedulingId(client.id); setScheduleDate("") }}
                          title="Schedule"
                          className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => client.email && setSendingId(isSending ? null : client.id)}
                        title={client.email ? "Send now" : "Add an email address to send"}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded",
                          client.email
                            ? "text-white bg-zinc-800 hover:bg-zinc-700"
                            : "text-zinc-400 bg-zinc-100 cursor-not-allowed"
                        )}
                      >
                        <Send className="h-3 w-3" />
                        {isSending ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => updateStatus(client.id, "skipped")}
                        title="Skip"
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded"
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteClient(client.id)}
                        title="Delete"
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {client.status !== "pending" && (
                    <button
                      onClick={() => deleteClient(client.id)}
                      title="Delete"
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Inline send panel */}
                {isSending && (
                  <SendPanel
                    client={client}
                    onSent={() => {
                      setSendingId(null)
                      setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: "sent", sentAt: new Date().toISOString() } : c))
                    }}
                    onCancel={() => setSendingId(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
