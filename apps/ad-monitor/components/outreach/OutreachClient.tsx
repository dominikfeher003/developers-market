"use client"

import { useState, useRef } from "react"
import Papa from "papaparse"
import { Upload, Loader2, CheckCircle2, XCircle, Send, ChevronDown, ChevronUp, Pencil, RotateCcw } from "lucide-react"
import { LANGUAGES } from "@/lib/languages"

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  title: string
  company: string
  website: string
  linkedin: string
}

interface GeneratedEmail {
  leadId: string
  subject: string
  body: string
  status: "pending" | "generating" | "done" | "error"
  errorMsg?: string
  selected: boolean
}

interface SendResult {
  leadId: string
  status: "idle" | "sending" | "sent" | "failed"
  error?: string
}

interface ColMap {
  email: string | null
  firstName: string | null
  lastName: string | null
  fullName: string | null
  title: string | null
  company: string | null
  website: string | null
  linkedin: string | null
}

interface DebugInfo {
  headers: string[]
  colMap: ColMap
  totalRows: number
  validRows: number
  firstRawRow: Record<string, string> | null
}

const EMAIL_HEADER_HINTS = ["email", "email address", "work email", "primary email", "e-mail", "mail"]
const FIRST_HINTS = ["first name", "firstname", "first_name", "given name"]
const LAST_HINTS = ["last name", "lastname", "last_name", "surname", "family name"]
const FULL_HINTS = ["name", "full name", "full_name", "contact name", "contact"]
const TITLE_HINTS = ["title", "job title", "position", "role", "occupation"]
const COMPANY_HINTS = ["company", "company name", "account name", "organization", "organisation", "organization name", "employer", "business", "business name"]
const WEBSITE_HINTS = ["website", "company website", "company url", "url", "web", "domain", "homepage"]
const LINKEDIN_HINTS = ["linkedin", "linkedin url", "linkedin profile", "profile url", "linkedin_url"]

function detectColMap(rows: Record<string, string>[]): ColMap {
  if (rows.length === 0) return { email: null, firstName: null, lastName: null, fullName: null, title: null, company: null, website: null, linkedin: null }

  // Normalise all header keys once
  const rawKeys = Object.keys(rows[0])
  const normKeys = rawKeys.map(k => k.replace(/^﻿/, "").trim().toLowerCase().replace(/\s+/g, " "))

  const match = (hints: string[]) => {
    const idx = normKeys.indexOf(hints.find(h => normKeys.includes(h)) ?? "")
    if (idx !== -1) return rawKeys[idx]
    // Partial scan
    const pidx = normKeys.findIndex(k => hints.some(h => k.includes(h) || h.includes(k)))
    return pidx !== -1 ? rawKeys[pidx] : null
  }

  // Try header-name matching first, but reject false positives like "Company Name for Emails"
  let emailCol = match(EMAIL_HEADER_HINTS)
  if (emailCol) {
    const norm = emailCol.trim().toLowerCase()
    if (norm.includes("company") || norm.includes("domain")) emailCol = null
  }

  // Fallback: scan values for a column that looks like email addresses
  if (!emailCol) {
    for (const key of rawKeys) {
      const vals = rows.slice(0, 10).map(r => r[key]?.trim() ?? "")
      const emailLike = vals.filter(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      if (emailLike.length >= Math.min(2, vals.filter(Boolean).length)) {
        emailCol = key
        break
      }
    }
  }

  return {
    email: emailCol,
    firstName: match(FIRST_HINTS),
    lastName: match(LAST_HINTS),
    fullName: match(FULL_HINTS),
    title: match(TITLE_HINTS),
    company: match(COMPANY_HINTS),
    website: match(WEBSITE_HINTS),
    linkedin: match(LINKEDIN_HINTS),
  }
}

function buildLead(row: Record<string, string>, map: ColMap): Lead | null {
  const g = (col: string | null) => col ? row[col]?.trim() ?? "" : ""

  const rawEmail = g(map.email)
  const email = rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : "N/A"

  let firstName = g(map.firstName)
  let lastName = g(map.lastName)

  if (!firstName && !lastName && map.fullName) {
    const parts = g(map.fullName).split(/\s+/)
    firstName = parts[0] ?? ""
    lastName = parts.slice(1).join(" ")
  }

  // Last resort: derive first name from email local part
  if (!firstName) {
    const local = email.split("@")[0].replace(/[._\-+]/g, " ").trim()
    firstName = local.split(" ")[0] ?? ""
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  }

  return {
    id: Math.random().toString(36).slice(2),
    firstName,
    lastName,
    email,
    title: g(map.title),
    company: g(map.company),
    website: g(map.website),
    linkedin: g(map.linkedin),
  }
}

export function OutreachClient() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [emails, setEmails] = useState<Map<string, GeneratedEmail>>(new Map())
  const [results, setResults] = useState<Map<string, SendResult>>(new Map())
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload")
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState("")
  const [parseError, setParseError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [language, setLanguage] = useState("English")
  const fileRef = useRef<HTMLInputElement>(null)

  const generatedCount = [...emails.values()].filter(e => e.status === "done").length
  const selectedCount = [...emails.values()].filter(e => e.selected && e.status === "done").length
  const sentCount = [...results.values()].filter(r => r.status === "sent").length
  const failedCount = [...results.values()].filter(r => r.status === "failed").length

  function commitLeads(parsed: Lead[]) {
    setLeads(parsed)
    const map = new Map<string, GeneratedEmail>()
    parsed.forEach(l => map.set(l.id, { leadId: l.id, subject: "", body: "", status: "pending", selected: l.email !== "N/A" }))
    setEmails(map)
    setResults(new Map())
    setStep("preview")
  }

  function handleFile(file: File) {
    setParseError(null)
    setDebugInfo(null)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headerKeys = result.meta.fields ?? []

        // Detect headerless CSV: a "header" key looks like an email or bare domain
        const isHeaderless = headerKeys.some(k => {
          const t = k.trim()
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) || /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/i.test(t)
        })

        if (isHeaderless) {
          Papa.parse<string[]>(file, {
            header: false,
            skipEmptyLines: true,
            complete: (r2) => {
              const rows = r2.data as string[][]
              if (rows.length === 0) { setParseError("CSV is empty."); return }
              const numCols = rows[0]?.length ?? 0

              // Find email col: scan for email-shaped values (handle comma-separated cells)
              let emailColIdx = -1
              for (let ci = 0; ci < numCols; ci++) {
                const sample = rows.slice(0, Math.min(10, rows.length))
                  .map(r => (r[ci] ?? "").split(",")[0].trim()).filter(v => v && v !== "-")
                const hits = sample.filter(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
                if (hits.length >= Math.min(2, sample.length || 1)) { emailColIdx = ci; break }
              }

              // Find domain col: short strings matching bare domain pattern
              let domainColIdx = -1
              for (let ci = 0; ci < numCols; ci++) {
                const sample = rows.slice(0, Math.min(5, rows.length)).map(r => (r[ci] ?? "").trim())
                const hits = sample.filter(v => /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/i.test(v) && !v.includes(" "))
                if (hits.length >= Math.min(3, sample.length || 1)) { domainColIdx = ci; break }
              }
              const companyColIdx = domainColIdx >= 0 ? domainColIdx + 1 : -1

              // Find social URLs col (contains linkedin.com)
              let socialColIdx = -1
              for (let ci = 0; ci < numCols; ci++) {
                const sample = rows.slice(0, Math.min(5, rows.length)).map(r => (r[ci] ?? "").trim())
                if (sample.some(v => v.includes("linkedin.com"))) { socialColIdx = ci; break }
              }

              const parsed: Lead[] = rows.map(row => {
                const rawEmail = emailColIdx >= 0 ? (row[emailColIdx] ?? "").split(",")[0].trim() : ""
                const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : "N/A"
                const company = companyColIdx >= 0 ? (row[companyColIdx] ?? "").trim() : ""
                const domain = domainColIdx >= 0 ? (row[domainColIdx] ?? "").trim() : ""
                const website = domain ? `https://${domain}` : ""
                let linkedin = ""
                if (socialColIdx >= 0) {
                  const urls = (row[socialColIdx] ?? "").split(",").map(s => s.trim())
                  linkedin = urls.find(s => s.includes("linkedin.com/company/")) ?? ""
                }
                if (!company && email === "N/A") return null
                return { id: Math.random().toString(36).slice(2), firstName: company, lastName: "", email, title: "", company, website, linkedin }
              }).filter((l): l is Lead => l !== null)

              setDebugInfo({
                headers: [`[no header row — ${numCols} columns]`],
                colMap: {
                  email: emailColIdx >= 0 ? `col ${emailColIdx}` : null,
                  firstName: companyColIdx >= 0 ? `col ${companyColIdx} (company)` : null,
                  lastName: null, fullName: null, title: null,
                  company: companyColIdx >= 0 ? `col ${companyColIdx}` : null,
                  website: domainColIdx >= 0 ? `col ${domainColIdx}` : null,
                  linkedin: socialColIdx >= 0 ? `col ${socialColIdx}` : null,
                },
                totalRows: rows.length,
                validRows: parsed.filter(l => l.email !== "N/A").length,
                firstRawRow: rows[0] ? Object.fromEntries(rows[0].map((v, i) => [`col${i}`, v])) : null,
              })

              if (parsed.length === 0) { setParseError("Couldn't extract any usable rows."); return }
              commitLeads(parsed)
            },
          })
          return
        }

        const rows = result.data as Record<string, string>[]
        const colMap = detectColMap(rows)
        const parsed = rows.map(r => buildLead(r, colMap)).filter((l): l is Lead => l !== null)

        setDebugInfo({
          headers: headerKeys,
          colMap,
          totalRows: rows.length,
          validRows: parsed.length,
          firstRawRow: rows[0] ?? null,
        })

        if (parsed.length === 0) {
          const headers = headerKeys.map(h => h.toLowerCase())
          const looksLikeSequenceReport = headers.some(h => h === "sent" || h === "delivered" || h === "opened %" || h === "path")
          const looksLikeAccountsExport = headers.some(h => h === "account stage" || h === "company name for emails" || h === "# employees")
          if (looksLikeSequenceReport) {
            setParseError(`This is an Apollo sequence analytics report — it tracks how past emails performed, not who to send to. Upload a contacts/leads CSV instead.`)
          } else if (looksLikeAccountsExport) {
            setParseError(`This looks like an Apollo Accounts/Companies export — it has company data but no personal email addresses. In Apollo, go to People → your saved list → Export → Export to CSV to get a Contacts export with personal emails.`)
          } else if (!colMap.email) {
            setParseError(`Couldn't find an email column. Detected columns: ${headerKeys.join(", ") || "none"}`)
          } else {
            setParseError(`Found email column "${colMap.email}" but all rows had invalid or empty email addresses.`)
          }
          return
        }

        commitLeads(parsed)
      },
    })
  }

  async function generateAll() {
    setGenerating(true)
    for (const lead of leads) {
      const current = emails.get(lead.id)
      if (current?.status === "done") continue
      if (current?.status === "error") {
        setEmails(prev => {
          const next = new Map(prev)
          next.set(lead.id, { ...next.get(lead.id)!, status: "pending", errorMsg: undefined, selected: true })
          return next
        })
      }

      setEmails(prev => {
        const next = new Map(prev)
        next.set(lead.id, { ...next.get(lead.id)!, status: "generating" })
        return next
      })

      try {
        const res = await fetch("/api/outreach/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: lead.firstName,
            lastName: lead.lastName,
            title: lead.title,
            company: lead.company,
            website: lead.website,
            language,
          }),
        })
        const data = await res.json()
        setEmails(prev => {
          const next = new Map(prev)
          next.set(lead.id, {
            leadId: lead.id,
            subject: data.subject ?? "",
            body: data.body ?? "",
            status: data.error ? "error" : "done",
            errorMsg: data.error,
            selected: !data.error,
          })
          return next
        })
      } catch (err) {
        setEmails(prev => {
          const next = new Map(prev)
          next.set(lead.id, { ...next.get(lead.id)!, status: "error", errorMsg: String(err) })
          return next
        })
      }
    }
    setGenerating(false)
  }

  async function sendAll() {
    setSending(true)
    const toSend = leads.filter(l => emails.get(l.id)?.selected && emails.get(l.id)?.status === "done" && l.email !== "N/A")

    for (const lead of toSend) {
      const email = emails.get(lead.id)!
      setResults(prev => {
        const next = new Map(prev)
        next.set(lead.id, { leadId: lead.id, status: "sending" })
        return next
      })

      try {
        const res = await fetch("/api/outreach/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: lead.email,
            toName: `${lead.firstName} ${lead.lastName}`.trim(),
            company: lead.company,
            subject: email.subject,
            body: email.body,
          }),
        })
        const data = await res.json()
        setResults(prev => {
          const next = new Map(prev)
          next.set(lead.id, { leadId: lead.id, status: data.success ? "sent" : "failed", error: data.error })
          return next
        })
      } catch (err) {
        setResults(prev => {
          const next = new Map(prev)
          next.set(lead.id, { leadId: lead.id, status: "failed", error: String(err) })
          return next
        })
      }
    }
    setSending(false)
    setStep("done")
  }

  function toggleSelect(id: string) {
    setEmails(prev => {
      const next = new Map(prev)
      const e = next.get(id)!
      next.set(id, { ...e, selected: !e.selected })
      return next
    })
  }

  function selectAll(val: boolean) {
    setEmails(prev => {
      const next = new Map(prev)
      next.forEach((e, k) => { if (e.status === "done") next.set(k, { ...e, selected: val }) })
      return next
    })
  }

  function startEdit(id: string) {
    setEditingId(id)
    setEditBody(emails.get(id)?.body ?? "")
    setExpandedId(id)
  }

  function saveEdit(id: string) {
    setEmails(prev => {
      const next = new Map(prev)
      next.set(id, { ...next.get(id)!, body: editBody })
      return next
    })
    setEditingId(null)
  }

  // ---- Render ----

  if (step === "upload" || leads.length === 0) {
    return (
      <div className="max-w-xl">
        <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
          Export your Apollo list as CSV, then upload it here. Claude will write a personalized email for each lead using their company info. You review, then send via Resend.
        </p>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          className="border-2 border-dashed border-zinc-700 rounded-xl p-14 text-center cursor-pointer hover:border-zinc-500 hover:bg-zinc-800/30 transition-colors"
        >
          <Upload className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
          <p className="text-zinc-300 font-medium">Drop Apollo CSV here</p>
          <p className="text-zinc-500 text-sm mt-1">or click to browse</p>
        </div>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {parseError ? (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-xs leading-relaxed">
            {parseError}
          </div>
        ) : (
          <p className="text-zinc-600 text-xs mt-3">Expected columns: First Name, Last Name, Email, Title, Company, Website</p>
        )}

        {debugInfo && (
          <div className="mt-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg font-mono text-xs space-y-3">
            <div className="text-zinc-400 font-sans font-semibold text-xs uppercase tracking-wide">Parse Debug</div>

            <div>
              <span className="text-zinc-500">Headers ({debugInfo.headers.length}): </span>
              <span className="text-zinc-300">{debugInfo.headers.length === 0 ? "none detected" : debugInfo.headers.join(", ")}</span>
            </div>

            <div>
              <div className="text-zinc-500 mb-1">Column mapping:</div>
              {([
                ["email", debugInfo.colMap.email],
                ["firstName", debugInfo.colMap.firstName],
                ["lastName", debugInfo.colMap.lastName],
                ["fullName", debugInfo.colMap.fullName],
                ["title", debugInfo.colMap.title],
                ["company", debugInfo.colMap.company],
                ["website", debugInfo.colMap.website],
                ["linkedin", debugInfo.colMap.linkedin],
              ] as [string, string | null][]).map(([field, col]) => (
                <div key={field} className="flex gap-2 pl-2">
                  <span className="text-zinc-500 w-20 shrink-0">{field}</span>
                  <span className="text-zinc-500">→</span>
                  {col
                    ? <span className="text-green-400">"{col}" ✓</span>
                    : <span className="text-red-400">NOT FOUND ✗</span>
                  }
                </div>
              ))}
            </div>

            <div>
              <span className="text-zinc-500">Rows: </span>
              <span className="text-zinc-300">{debugInfo.totalRows} total, </span>
              <span className={debugInfo.validRows > 0 ? "text-green-400" : "text-red-400"}>{debugInfo.validRows} with valid emails</span>
            </div>

            {debugInfo.firstRawRow && (
              <div>
                <div className="text-zinc-500 mb-1">First row sample:</div>
                {Object.entries(debugInfo.firstRawRow).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="flex gap-2 pl-2">
                    <span className="text-zinc-500 truncate max-w-[140px]">{k}:</span>
                    <span className="text-zinc-300 truncate">"{v}"</span>
                  </div>
                ))}
                {Object.keys(debugInfo.firstRawRow).length > 8 && (
                  <div className="pl-2 text-zinc-600">… {Object.keys(debugInfo.firstRawRow).length - 8} more columns</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-6 text-sm">
        <span className="text-zinc-300"><span className="font-bold text-white">{leads.length}</span> leads loaded</span>
        <span className="text-zinc-300"><span className="font-bold text-green-400">{generatedCount}</span> emails generated</span>
        {sending || step === "done" ? (
          <>
            <span className="text-zinc-300"><span className="font-bold text-green-400">{sentCount}</span> sent</span>
            <span className="text-zinc-300"><span className="font-bold text-red-400">{failedCount}</span> failed</span>
          </>
        ) : null}
        <button onClick={() => { setLeads([]); setEmails(new Map()); setResults(new Map()); setStep("upload"); setDebugInfo(null); setParseError(null) }} className="text-zinc-500 hover:text-zinc-300 ml-auto text-xs flex items-center gap-1">
          <RotateCcw className="h-3 w-3" /> Start over
        </button>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-400 shrink-0">Language:</span>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            disabled={generating}
            className="text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        {generatedCount < leads.length && (
          <button
            onClick={generateAll}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {generating ? `Generating... (${generatedCount}/${leads.length})` : `Generate ${leads.length - generatedCount} Emails`}
          </button>
        )}
        {generatedCount > 0 && step !== "done" && (
          <>
            <button
              onClick={sendAll}
              disabled={sending || selectedCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? `Sending... (${sentCount + failedCount}/${selectedCount})` : `Send ${selectedCount} Selected`}
            </button>
            <button onClick={() => selectAll(true)} className="px-3 py-2 text-xs text-zinc-400 hover:text-white bg-zinc-800 rounded-lg">Select all</button>
            <button onClick={() => selectAll(false)} className="px-3 py-2 text-xs text-zinc-400 hover:text-white bg-zinc-800 rounded-lg">Deselect all</button>
          </>
        )}
      </div>

      {/* Email list */}
      <div className="space-y-2">
        {leads.map(lead => {
          const email = emails.get(lead.id)
          const result = results.get(lead.id)
          const isExpanded = expandedId === lead.id
          const isEditing = editingId === lead.id

          return (
            <div key={lead.id} className={`border rounded-lg overflow-hidden transition-colors ${email?.selected ? "border-zinc-700 bg-zinc-800/40" : "border-zinc-800 bg-zinc-900/40"}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Checkbox */}
                {email?.status === "done" && lead.email !== "N/A" && (
                  <input
                    type="checkbox"
                    checked={email.selected}
                    onChange={() => toggleSelect(lead.id)}
                    className="accent-indigo-500 h-4 w-4 shrink-0"
                  />
                )}
                {lead.email === "N/A" && (
                  <span className="text-xs text-zinc-600 shrink-0">no email</span>
                )}

                {/* Status icon */}
                <div className="shrink-0">
                  {email?.status === "generating" && <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />}
                  {email?.status === "done" && result?.status === "sent" && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                  {email?.status === "done" && result?.status === "failed" && <XCircle className="h-4 w-4 text-red-400" />}
                  {email?.status === "done" && !result && <CheckCircle2 className="h-4 w-4 text-zinc-600" />}
                  {email?.status === "error" && <XCircle className="h-4 w-4 text-red-400" />}
                  {email?.status === "pending" && <div className="h-4 w-4 rounded-full border border-zinc-600" />}
                </div>

                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white font-medium">
                    {lead.firstName} {lead.lastName}
                  </span>
                  <span className="text-zinc-500 text-xs ml-2">{lead.title}{lead.company ? ` @ ${lead.company}` : ""}</span>
                  {email?.status === "done" && (
                    <div className="text-xs text-zinc-400 mt-0.5 truncate">{email.subject}</div>
                  )}
                  {email?.status === "error" && (
                    <div className="text-xs text-red-400 mt-0.5 truncate">{email.errorMsg ?? "Generation failed"}</div>
                  )}
                  {result?.status === "failed" && (
                    <div className="text-xs text-red-400 mt-0.5 truncate">Send failed: {result.error ?? "unknown error"}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {email?.status === "done" && (
                    <button onClick={() => startEdit(lead.id)} className="text-zinc-500 hover:text-zinc-300 p-1">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {email?.status === "done" && (
                    <button onClick={() => setExpandedId(isExpanded ? null : lead.id)} className="text-zinc-500 hover:text-zinc-300 p-1">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded email body */}
              {isExpanded && email?.status === "done" && (
                <div className="border-t border-zinc-700/50 px-4 py-4 bg-zinc-900/60">
                  <div className="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wide">Subject</div>
                  <div className="text-sm text-zinc-200 mb-4">{email.subject}</div>
                  <div className="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wide">Body</div>
                  {isEditing ? (
                    <div>
                      <textarea
                        value={editBody}
                        onChange={e => setEditBody(e.target.value)}
                        rows={8}
                        className="w-full bg-zinc-800 border border-zinc-600 rounded text-sm text-zinc-200 p-3 resize-none focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => saveEdit(lead.id)} className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{email.body}</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
