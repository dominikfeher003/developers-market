"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, RefreshCw, Mail, Building2, ChevronDown, ChevronUp } from "lucide-react"
import { usePortalI18n } from "@/lib/i18n/context"
import { tr } from "@/lib/i18n/en"
import type { InboxEntry } from "@/app/api/outreach/inbox/route"

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function InboxView() {
  const { t } = usePortalI18n()
  const [entries, setEntries] = useState<InboxEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [expandedUid, setExpandedUid] = useState<number | null>(null)

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/outreach/inbox${refresh ? "?refresh=1" : ""}`)
      const data = await res.json() as { entries?: InboxEntry[]; fetchedAt?: string; error?: string }
      if (data.error) {
        setError(data.error)
        setEntries([])
      } else {
        setEntries(data.entries ?? [])
        setFetchedAt(data.fetchedAt ?? null)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load(false) }, [load])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">{t.outreach.inbox.connecting}</p>
      </div>
    )
  }

  const count = entries.length
  const countStr = tr(count === 1 ? t.outreach.inbox.reply1 : t.outreach.inbox.replyN, { n: count })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{countStr}</p>
          {fetchedAt && (
            <p className="text-xs text-muted-foreground">
              {tr(t.outreach.inbox.synced, { when: timeAgo(fetchedAt) })}
            </p>
          )}
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-ring/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {t.outreach.inbox.refresh}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm space-y-1">
          <p className="font-medium text-red-400">{t.outreach.inbox.errorTitle}</p>
          <p className="text-red-400/80">{error}</p>
          <p className="text-red-400/60 text-xs">{t.outreach.inbox.errorHint}</p>
        </div>
      )}

      {!error && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl text-center gap-2">
          <Mail className="h-8 w-8 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">{t.outreach.inbox.noReplies}</p>
          <p className="text-sm text-muted-foreground/60">{t.outreach.inbox.noRepliesHint}</p>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry) => {
          const expanded = expandedUid === entry.uid
          return (
            <div
              key={entry.uid}
              onClick={() => setExpandedUid(expanded ? null : entry.uid)}
              className="cursor-pointer bg-card border border-border hover:border-ring/40 rounded-xl px-4 py-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-foreground truncate">{entry.fromName}</span>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{entry.from}</span>
                  </div>
                  {entry.leadCompany && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Building2 className="h-3 w-3" />
                      {entry.leadCompany}
                    </div>
                  )}
                  <p className="text-sm font-medium text-foreground truncate">{entry.subject}</p>
                  {!expanded && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{entry.preview}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">{timeAgo(entry.receivedAt)}</span>
                  {expanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
              </div>
              {expanded && entry.body && (
                <div className="mt-3 pt-3 border-t border-border">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                    {entry.body}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
