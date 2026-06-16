"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { usePortalI18n } from "@/lib/i18n/context"
import { OutreachChat } from "./OutreachChat"
import { InboxView } from "./InboxView"

type Tab = "assistant" | "inbox"

export function OutreachTabs() {
  const { t } = usePortalI18n()
  const [tab, setTab] = useState<Tab>("assistant")

  const tabs: { key: Tab; label: string }[] = [
    { key: "assistant", label: t.outreach.tabs.assistant },
    { key: "inbox", label: t.outreach.tabs.inbox },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 border-b border-border mb-4 shrink-0">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              tab === key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "assistant" && (
        <div className="flex-1 min-h-0">
          <OutreachChat />
        </div>
      )}

      {tab === "inbox" && (
        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin]">
          <InboxView />
        </div>
      )}
    </div>
  )
}
