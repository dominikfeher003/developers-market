"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/layout/TopBar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BudgetDialog } from "@/components/campaigns/BudgetDialog"
import { Campaign } from "@/lib/types"
import { Loader2, Pause, Play, DollarSign } from "lucide-react"
import { useActiveClient } from "@/lib/client-context"

export default function CampaignsPage() {
  const { activeClientId } = useActiveClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [budgetCampaign, setBudgetCampaign] = useState<Campaign | null>(null)
  const [sortKey, setSortKey] = useState<"name" | "roas" | "spend">("roas")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const load = useCallback(async () => {
    setLoading(true)
    const url = activeClientId ? `/api/campaigns?clientId=${activeClientId}` : "/api/campaigns"
    const res = await fetch(url)
    const data = await res.json()
    setCampaigns(data.campaigns ?? [])
    setLoading(false)
  }, [activeClientId])

  useEffect(() => { load() }, [load])

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  const sorted = [...campaigns].sort((a, b) => {
    let av = 0, bv = 0
    if (sortKey === "name") return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    if (sortKey === "roas") { av = a.insights.last7d.purchase_roas; bv = b.insights.last7d.purchase_roas }
    if (sortKey === "spend") { av = a.insights.last7d.spend; bv = b.insights.last7d.spend }
    return sortDir === "asc" ? av - bv : bv - av
  })

  async function toggleStatus(campaign: Campaign) {
    setActionLoading(campaign.id)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: campaign.status === "ACTIVE" ? "pause" : "resume",
          clientId: activeClientId ?? undefined,
        }),
      })
      if (res.ok) await load()
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      <TopBar title="Campaigns" />
      <div className="p-4 md:p-6">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
        ) : (
          <div className="bg-card rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                    Campaign {sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Daily Budget</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("roas")}>
                    ROAS {sortKey === "roas" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead className="hidden sm:table-cell cursor-pointer" onClick={() => toggleSort("spend")}>
                    Spend {sortKey === "spend" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Impressions</TableHead>
                  <TableHead className="hidden md:table-cell">Clicks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-zinc-400">
                      No campaigns. Enter Meta credentials in Settings.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-[140px] sm:max-w-xs truncate">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {c.daily_budget !== null ? `$${(c.daily_budget / 100).toFixed(0)}/day` : "Lifetime"}
                      </TableCell>
                      <TableCell>
                        <span className={
                          c.insights.last7d.purchase_roas >= 3 ? "text-green-600 font-semibold" :
                          c.insights.last7d.purchase_roas >= 1.5 ? "text-yellow-600 font-semibold" :
                          "text-red-600 font-semibold"
                        }>
                          {c.insights.last7d.purchase_roas.toFixed(2)}x
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">${c.insights.last7d.spend.toFixed(0)}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.insights.last7d.impressions.toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.insights.last7d.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.daily_budget !== null && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setBudgetCampaign(c)}>
                              <DollarSign className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => toggleStatus(c)}
                            disabled={actionLoading === c.id}
                          >
                            {actionLoading === c.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : c.status === "ACTIVE" ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      {budgetCampaign && (
        <BudgetDialog
          campaign={budgetCampaign}
          open={!!budgetCampaign}
          onClose={() => setBudgetCampaign(null)}
          onSaved={load}
          clientId={activeClientId ?? undefined}
        />
      )}
    </div>
  )
}
