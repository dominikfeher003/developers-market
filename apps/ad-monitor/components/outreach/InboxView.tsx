"use client"

import { useState, useEffect, useCallback } from "react"
import { InboxEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, RefreshCw, Mail, Building2, ChevronDown, ChevronUp } from "lucide-react"

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function InboxView() {
  const [entries, setEntries] = useState<InboxEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [expandedUid, setExpandedUid] = useState<number | null>(null)

  const fetch_ = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/outreach/inbox${refresh ? "?refresh=1" : ""}`)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setEntries([])
      } else {
        setEntries(data.entries ?? [])
        setFetchedAt(data.fetchedAt)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetch_(false) }, [fetch_])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Connecting to inbox...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-700">
            {entries.length} {entries.length === 1 ? "reply" : "replies"} from leads
          </p>
          {fetchedAt && (
            <p className="text-xs text-zinc-400">Last synced {timeAgo(fetchedAt)}</p>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetch_(true)} disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 space-y-1">
          <p className="font-medium">Could not connect to inbox</p>
          <p className="text-red-600">{error}</p>
          <p className="text-red-500 text-xs">Check your IMAP credentials in Settings → Email Notifications.</p>
        </div>
      )}

      {!error && entries.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed rounded-lg text-zinc-400">
          <Mail className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-zinc-500">No replies yet</p>
          <p className="text-sm mt-1">Only emails from leads you've outreached to will appear here.</p>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry) => {
          const expanded = expandedUid === entry.uid
          return (
            <Card key={entry.uid} className="cursor-pointer hover:border-zinc-300 transition-colors" onClick={() => setExpandedUid(expanded ? null : entry.uid)}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm text-zinc-900 truncate">{entry.fromName}</span>
                      <span className="text-xs text-zinc-400 shrink-0">{entry.from}</span>
                    </div>
                    {entry.leadCompany && (
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                        <Building2 className="h-3 w-3" />
                        {entry.leadCompany}
                      </div>
                    )}
                    <p className="text-sm font-medium text-zinc-800 truncate">{entry.subject}</p>
                    {!expanded && (
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{entry.preview}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-zinc-400">{timeAgo(entry.receivedAt)}</span>
                    {expanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                  </div>
                </div>
                {expanded && entry.body && (
                  <div className="mt-3 pt-3 border-t border-zinc-100">
                    <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {entry.body}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
