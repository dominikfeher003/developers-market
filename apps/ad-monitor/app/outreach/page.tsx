"use client"

import { useState } from "react"
import { OutreachClient } from "@/components/outreach/OutreachClient"
import { InboxView } from "@/components/outreach/InboxView"
import { PotentialClients } from "@/components/outreach/PotentialClients"
import { PlacesSearch } from "@/components/outreach/PlacesSearch"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "compose", label: "Compose" },
  { key: "pipeline", label: "Potential Clients" },
  { key: "places", label: "Find on Maps" },
  { key: "inbox", label: "Inbox" },
] as const

type Tab = typeof TABS[number]["key"]

export default function OutreachPage() {
  const [tab, setTab] = useState<Tab>("compose")

  return (
    <div className="p-4 md:p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-zinc-900">Outreach</h1>
        <p className="text-zinc-500 text-sm mt-1">Personalized cold emails from your Apollo export</p>
      </div>

      <div className="flex gap-1 border-b border-zinc-200 mb-5 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === key
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "compose" && <OutreachClient />}
      {tab === "pipeline" && <PotentialClients />}
      {tab === "places" && <PlacesSearch />}
      {tab === "inbox" && <InboxView />}
    </div>
  )
}
