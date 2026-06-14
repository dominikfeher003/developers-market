"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert } from "@/lib/types"
import { Loader2, Trash2 } from "lucide-react"

const ACTION_LABELS: Record<string, string> = {
  pause: "Paused",
  resume: "Resumed",
  scale_budget: "Scaled budget",
  notify_only: "Notified",
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/alerts?limit=100")
    const data = await res.json()
    setAlerts(data.alerts ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function clearAll() {
    if (!confirm("Clear all alerts?")) return
    await fetch("/api/alerts", { method: "DELETE" })
    load()
  }

  return (
    <div>
      <TopBar title="Alerts" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">{total} alert{total !== 1 ? "s" : ""} total</p>
          {alerts.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5 text-red-500 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
        ) : (
          <div className="bg-white rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Time</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="hidden sm:table-cell">Rule</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden md:table-cell">Metric Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-zinc-400">
                      No alerts yet. Run the agent to see actions here.
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="hidden sm:table-cell text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(a.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-[120px] sm:max-w-xs truncate font-medium">{a.campaignName}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-zinc-600">{a.ruleName}</TableCell>
                      <TableCell>
                        {ACTION_LABELS[a.action] ?? a.action}
                        {a.action === "scale_budget" && a.actionValue != null && (
                          <span className="text-xs text-zinc-500 ml-1">
                            ({a.actionValue > 0 ? "+" : ""}{a.actionValue}%)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {a.metricName}: <span className="font-mono">{a.metricValue.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.status === "success" ? "default" : a.status === "error" ? "destructive" : "secondary"}>
                          {a.status}
                        </Badge>
                        {a.errorMessage && (
                          <p className="text-xs text-red-500 mt-0.5 max-w-xs truncate" title={a.errorMessage}>
                            {a.errorMessage}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
