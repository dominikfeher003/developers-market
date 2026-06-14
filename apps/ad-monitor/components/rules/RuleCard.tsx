"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Rule } from "@/lib/types"
import { Pencil, Trash2 } from "lucide-react"
import { RuleDialog } from "./RuleDialog"

interface Props {
  rule: Rule
  onChanged: (optimistic?: Rule) => void
}

const METRIC_LABELS: Record<string, string> = {
  purchase_roas: "ROAS",
  spend: "Daily Spend ($)",
  impressions: "Impressions",
  clicks: "Clicks",
  ctr: "CTR (%)",
  reach: "Reach",
  frequency: "Frequency",
  video_views: "Video Views",
  video_view_rate: "Video View Rate (%)",
  engagement_rate: "Engagement Rate (%)",
  cost_per_engagement: "Cost per Engagement ($)",
  post_likes: "Post Likes",
  post_comments: "Post Comments",
  post_shares: "Post Shares",
}

const ACTION_LABELS: Record<string, string> = {
  pause: "pause",
  resume: "resume",
  scale_budget: "scale budget",
  notify_only: "notify only",
}

export function RuleCard({ rule, onChanged }: Props) {
  const [editing, setEditing] = useState(false)

  async function toggleEnabled() {
    onChanged({ ...rule, enabled: !rule.enabled })
    await fetch(`/api/rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    })
    onChanged()
  }

  async function deleteRule() {
    if (!confirm(`Delete rule "${rule.name}"?`)) return
    const res = await fetch(`/api/rules/${rule.id}`, { method: "DELETE" })
    if (res.ok) onChanged()
  }

  const opText = rule.operator === "less_than" ? "is below" : "is above"
  const dayText = `${rule.windowDays} day${rule.windowDays !== 1 ? "s" : ""}`
  const actionText = `${ACTION_LABELS[rule.action] ?? rule.action}${rule.action === "scale_budget" && rule.actionValue != null ? ` ${rule.actionValue > 0 ? "+" : ""}${rule.actionValue}%` : ""}`
  const plain = `${METRIC_LABELS[rule.metric] ?? rule.metric} ${opText} ${rule.threshold} for ${dayText} → ${actionText}`

  return (
    <>
      <Card className={rule.enabled ? "" : "opacity-50"}>
        <CardContent className="flex items-start justify-between gap-3 pt-4">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{rule.name}</p>
            <p className="text-xs text-zinc-500">{plain}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={rule.enabled} onCheckedChange={toggleEnabled} />
            <Button size="icon" variant="ghost" onClick={() => setEditing(true)} className="h-7 w-7">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={deleteRule} className="h-7 w-7 text-red-500 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      {editing && (
        <RuleDialog open={editing} onClose={() => setEditing(false)} onSaved={onChanged} rule={rule} />
      )}
    </>
  )
}
