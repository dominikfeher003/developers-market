"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/layout/TopBar"
import { CampaignCard } from "@/components/dashboard/CampaignCard"
import { SpendChart } from "@/components/dashboard/SpendChart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Campaign, DailyInsight } from "@/lib/types"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [campRes, settingsRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/settings"),
      ])
      const campData = campRes.ok ? await campRes.json() : {}
      const settingsData = settingsRes.ok ? await settingsRes.json() : {}
      setCampaigns(campData.campaigns ?? [])
      setFetchedAt(campData.fetchedAt ?? null)
      setLastRun(settingsData.lastAgentRun ?? null)
    } catch {
      // API unavailable (e.g. DATABASE_URL not configured) — show empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const dateMap: Record<string, DailyInsight> = {}
  for (const c of campaigns) {
    for (const d of (c.insights?.dailySeries ?? [])) {
      if (dateMap[d.date]) {
        dateMap[d.date].spend += d.spend
        dateMap[d.date].impressions += d.impressions
        dateMap[d.date].clicks += d.clicks
      } else {
        dateMap[d.date] = { ...d }
      }
    }
  }
  const allDailySeries = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date))

  const totals = campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + (c.insights?.last7d?.spend ?? 0),
      roas: acc.roas + (c.insights?.last7d?.purchase_roas ?? 0),
      impressions: acc.impressions + (c.insights?.last7d?.impressions ?? 0),
      clicks: acc.clicks + (c.insights?.last7d?.clicks ?? 0),
    }),
    { spend: 0, roas: 0, impressions: 0, clicks: 0 }
  )
  const avgRoas = campaigns.length > 0 ? totals.roas / campaigns.length : 0

  return (
    <div>
      <TopBar title="Dashboard" lastRun={lastRun} />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-24 text-zinc-400">
            <p className="text-lg font-medium">No campaigns found</p>
            <p className="text-sm mt-1">Enter your Meta API credentials in Settings to get started</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: "Total Spend (7d)", value: `$${totals.spend.toFixed(0)}` },
                { label: "Avg ROAS (7d)", value: `${avgRoas.toFixed(2)}x` },
                { label: "Impressions (7d)", value: totals.impressions.toLocaleString() },
                { label: "Clicks (7d)", value: totals.clicks.toLocaleString() },
              ].map(({ label, value }) => (
                <Card key={label}>
                  <CardContent className="pt-5">
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {allDailySeries.length > 0 && (
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm font-medium text-zinc-600">Total Daily Spend</CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <SpendChart data={allDailySeries} />
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} onStatusChange={load} />
              ))}
            </div>

            {fetchedAt && (
              <p className="text-xs text-zinc-400 text-right">
                Data as of {new Date(fetchedAt).toLocaleTimeString()}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
