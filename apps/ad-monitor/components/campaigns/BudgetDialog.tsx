"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Campaign } from "@/lib/types"

interface Props {
  campaign: Campaign
  open: boolean
  onClose: () => void
  onSaved: () => void
  clientId?: string
}

export function BudgetDialog({ campaign, open, onClose, onSaved, clientId }: Props) {
  const current = campaign.daily_budget !== null ? campaign.daily_budget / 100 : 0
  const [value, setValue] = useState(String(current))
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_budget", value: parseFloat(value), clientId }),
      })
      if (res.ok) { onSaved(); onClose() }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Daily Budget</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-sm text-zinc-500">{campaign.name}</p>
          <div className="space-y-1">
            <Label>Daily budget (USD)</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min="1"
              step="1"
            />
          </div>
          <p className="text-xs text-zinc-400">Current: ${current.toFixed(2)}/day</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !value || parseFloat(value) <= 0}>
            {saving ? "Saving..." : "Update budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
