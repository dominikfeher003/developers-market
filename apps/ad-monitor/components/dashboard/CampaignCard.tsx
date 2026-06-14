"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts"
import { Campaign } from "@/lib/types"
import { Pause, Play, Loader2 } from "lucide-react"

interface Props {
  campaign: Campaign
  onStatusChange?: () => void
}

function roasColor(roas: number) {
  if (roas >= 3) return "text-green-600"
  if (roas >= 1.5) return "text-yellow-600"
  return "text-red-600"
}

export function CampaignCard({ campaign, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false)
  const { last7d, dailySeries } = campaign.insights
  const chartData = dailySeries.map((d) => ({ date: d.date.slice(5), roas: d.purchase_roas }))

  async function toggleStatus() {
    setLoading(true)
    try {
      await fetch(`/api/campaigns/${campaign.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: campaign.status === "ACTIVE" ? "pause" : "resume" }),
      })
      onStatusChange?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex flex-col gap-2">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-tight">{campaign.name}</CardTitle>
          <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"} className="shrink-0 text-xs">
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-zinc-500">ROAS (7d avg)</p>
            <p className={`text-xl font-bold ${roasColor(last7d.purchase_roas)}`}>
              {last7d.purchase_roas.toFixed(2)}x
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Spend (7d)</p>
            <p className="text-xl font-bold text-zinc-900">${last7d.spend.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Impressions</p>
            <p className="font-semibold text-zinc-700">{last7d.impressions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Clicks</p>
            <p className="font-semibold text-zinc-700">{last7d.clicks.toLocaleString()}</p>
          </div>
        </div>

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={48}>
            <LineChart data={chartData}>
              <Line type="monotone" dataKey="roas" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(v) => [`${Number(v).toFixed(2)}x`, "ROAS"]}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <div className="flex items-center justify-between">
          {campaign.daily_budget !== null && (
            <span className="text-xs text-zinc-500">
              Budget: ${(campaign.daily_budget / 100).toFixed(0)}/day
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleStatus}
            disabled={loading}
            className="ml-auto gap-1.5 text-xs"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : campaign.status === "ACTIVE" ? (
              <><Pause className="h-3 w-3" /> Pause</>
            ) : (
              <><Play className="h-3 w-3" /> Resume</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
