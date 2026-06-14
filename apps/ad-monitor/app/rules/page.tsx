"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { RuleCard } from "@/components/rules/RuleCard"
import { RuleDialog } from "@/components/rules/RuleDialog"
import { Rule } from "@/lib/types"
import { Plus, Loader2, LayoutTemplate } from "lucide-react"
import { useActiveClient } from "@/lib/client-context"

export default function RulesPage() {
  const { activeClientId } = useActiveClient()
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState<string | null>(null)

  const load = useCallback(async (optimistic?: Rule) => {
    if (optimistic) {
      setRules((prev) => prev.map((r) => r.id === optimistic.id ? optimistic : r))
      return
    }
    setLoading(true)
    const res = await fetch("/api/rules")
    const data = await res.json()
    const all: Rule[] = data.rules ?? []
    setRules(all.filter((r) => (r.clientId ?? null) === activeClientId))
    setLoading(false)
  }, [activeClientId])

  useEffect(() => { load() }, [load])

  async function loadDefaults() {
    setSeeding(true)
    setSeedMsg(null)
    const res = await fetch("/api/rules/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: activeClientId }),
    })
    const data = await res.json()
    setSeedMsg(`${data.added} default rules added`)
    await load()
    setSeeding(false)
    setTimeout(() => setSeedMsg(null), 4000)
  }

  return (
    <div>
      <TopBar title="Automation Rules" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <p className="text-sm text-zinc-500 flex-1">
            Rules run daily — the agent pauses, resumes, scales budgets, or sends alerts automatically when conditions are met.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {seedMsg && (
              <span className="text-xs text-green-600 font-medium">{seedMsg}</span>
            )}
            <Button variant="outline" onClick={loadDefaults} disabled={seeding} className="gap-1.5">
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutTemplate className="h-4 w-4" />}
              Load Default Rules
            </Button>
            <Button onClick={() => setCreating(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Rule
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
        ) : rules.length === 0 ? (
          <div className="text-center py-24 text-zinc-400 border-2 border-dashed rounded-lg">
            <p className="font-medium text-zinc-600">No rules yet</p>
            <p className="text-sm mt-1 max-w-sm mx-auto">
              Rules automatically pause, resume, scale budgets, or alert you when your campaigns hit certain thresholds.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <Button variant="outline" className="gap-1.5" onClick={loadDefaults} disabled={seeding}>
                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutTemplate className="h-4 w-4" />}
                Load Default Rules
              </Button>
              <Button className="gap-1.5" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Add your first rule
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {rules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} onChanged={load} />
            ))}
          </div>
        )}
      </div>

      {creating && (
        <RuleDialog open={creating} onClose={() => setCreating(false)} onSaved={load} clientId={activeClientId} />
      )}
    </div>
  )
}
