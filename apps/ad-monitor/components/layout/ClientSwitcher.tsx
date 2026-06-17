"use client"

import { useState, useEffect } from "react"
import { useActiveClient } from "@/lib/client-context"
import { Client } from "@/lib/types"

type MaskedClient = Omit<Client, "metaAccessToken"> & { metaAccessToken: string }

export function ClientSwitcher() {
  const { activeClientId, setActiveClient } = useActiveClient()
  const [clients, setClients] = useState<MaskedClient[]>([])

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []))
      .catch(() => {})
  }, [])

  if (clients.length === 0) return null

  const active = clients.find((c) => c.id === activeClientId)

  return (
    <div className="px-3 py-2 border-b border-zinc-800">
      <p className="text-xs text-zinc-500 mb-1.5 px-1">Active client</p>
      <select
        value={activeClientId ?? ""}
        onChange={(e) => setActiveClient(e.target.value || null)}
        className="w-full bg-zinc-800 text-zinc-100 text-xs rounded px-2 py-1.5 border border-zinc-700 focus:outline-none focus:border-zinc-500"
      >
        <option value="">Default (Settings)</option>
        {clients.filter((c) => c.enabled).map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {active && (
        <div className="mt-2 space-y-1 px-1">
          {active.metaAdAccountId && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">Meta</span>
              <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]" title={active.metaAdAccountId}>{active.metaAdAccountId}</span>
            </div>
          )}
          {active.tiktokAdAccountId && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">TikTok</span>
              <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]" title={active.tiktokAdAccountId}>{active.tiktokAdAccountId}</span>
            </div>
          )}
          {active.userEmail && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">Portal</span>
              <span className="text-[10px] text-zinc-400 truncate max-w-[120px]" title={active.userEmail}>{active.userEmail}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Status</span>
            <span className={`text-[10px] font-medium ${active.enabled ? "text-emerald-400" : "text-zinc-500"}`}>
              {active.enabled ? "Active" : "Disabled"}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
