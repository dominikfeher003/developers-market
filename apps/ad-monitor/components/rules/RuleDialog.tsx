"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Rule } from "@/lib/types"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  rule?: Rule
  clientId?: string | null
}

export function RuleDialog({ open, onClose, onSaved, rule, clientId = null }: Props) {
  const [name, setName] = useState(rule?.name ?? "")
  const [metric, setMetric] = useState(rule?.metric ?? "purchase_roas")
  const [operator, setOperator] = useState(rule?.operator ?? "less_than")
  const [threshold, setThreshold] = useState(String(rule?.threshold ?? "1.5"))
  const [windowDays, setWindowDays] = useState(String(rule?.windowDays ?? "3"))
  const [action, setAction] = useState(rule?.action ?? "pause")
  const [actionValue, setActionValue] = useState(String(rule?.actionValue ?? "20"))
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const body = {
      name,
      enabled: rule?.enabled ?? true,
      metric,
      operator,
      threshold: parseFloat(threshold),
      windowDays: parseInt(windowDays),
      action,
      actionValue: action === "scale_budget" ? parseFloat(actionValue) : null,
      appliesTo: "all",
      campaignIds: [],
      clientId: rule?.clientId ?? clientId,
    }
    const url = rule ? `/api/rules/${rule.id}` : "/api/rules"
    const method = rule ? "PUT" : "POST"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Rule" : "New Rule"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5 block">Rule Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pause low ROAS campaigns"
            />
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-3 border">
            {/* When [metric] is [below/above] [value] */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-zinc-500 font-medium w-10">When</span>
              <Select value={metric} onValueChange={(v) => v && setMetric(v as typeof metric)}>
                <SelectTrigger className="h-8 w-auto text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Performance</SelectLabel>
                    <SelectItem value="purchase_roas">ROAS</SelectItem>
                    <SelectItem value="spend">Daily Spend ($)</SelectItem>
                    <SelectItem value="ctr">CTR (%)</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Volume</SelectLabel>
                    <SelectItem value="impressions">Impressions</SelectItem>
                    <SelectItem value="clicks">Clicks</SelectItem>
                    <SelectItem value="reach">Reach</SelectItem>
                    <SelectItem value="video_views">Video Views</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Rates</SelectLabel>
                    <SelectItem value="frequency">Frequency</SelectItem>
                    <SelectItem value="video_view_rate">Video View Rate (%)</SelectItem>
                    <SelectItem value="engagement_rate">Engagement Rate (%)</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Cost</SelectLabel>
                    <SelectItem value="cost_per_engagement">Cost per Engagement ($)</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Social</SelectLabel>
                    <SelectItem value="post_likes">Post Likes</SelectItem>
                    <SelectItem value="post_comments">Post Comments</SelectItem>
                    <SelectItem value="post_shares">Post Shares</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <span className="text-zinc-500">is</span>
              <Select value={operator} onValueChange={(v) => v && setOperator(v as typeof operator)}>
                <SelectTrigger className="h-8 w-auto text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less_than">below</SelectItem>
                  <SelectItem value="greater_than">above</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-20 h-8 text-sm"
                step="0.1"
              />
            </div>

            {/* for [N] days in a row */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-zinc-500 font-medium w-10">for</span>
              <Select value={windowDays} onValueChange={(v) => v && setWindowDays(v)}>
                <SelectTrigger className="h-8 w-auto text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} day{d !== 1 ? "s" : ""} in a row</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-zinc-500">across all campaigns</span>
            </div>

            {/* → then [action] */}
            <div className="flex flex-wrap items-center gap-2 text-sm pt-2 border-t border-border">
              <span className="text-zinc-500 font-medium w-10">→</span>
              <Select value={action} onValueChange={(v) => v && setAction(v as typeof action)}>
                <SelectTrigger className="h-8 w-auto text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pause">pause the campaign</SelectItem>
                  <SelectItem value="resume">resume the campaign</SelectItem>
                  <SelectItem value="scale_budget">scale budget by</SelectItem>
                  <SelectItem value="notify_only">notify only (no change)</SelectItem>
                </SelectContent>
              </Select>
              {action === "scale_budget" && (
                <>
                  <Input
                    type="number"
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    className="w-16 h-8 text-sm"
                    placeholder="20"
                  />
                  <span className="text-zinc-500">%</span>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name || !threshold}>
            {saving ? "Saving..." : "Save rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
