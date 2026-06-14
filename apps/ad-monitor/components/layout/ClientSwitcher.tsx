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
    </div>
  )
}
