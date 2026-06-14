import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { readRules } from "@/lib/storage"
import { RuleRow } from "@/components/rules/RuleRow"

export default async function RulesPage() {
  const client = await getUserClient()
  if (!client) redirect("/dashboard")

  const allRules = await readRules()
  const rules = allRules.filter((r) => r.clientId === client.id)
  const active = rules.filter((r) => r.enabled)
  const disabled = rules.filter((r) => !r.enabled)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <p className="text-sm text-zinc-500">
        These automation rules run daily. When a condition is met, the agent takes action automatically on your behalf.
      </p>

      {rules.length === 0 ? (
        <div className="text-center py-24 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
          <p className="font-medium">No rules configured</p>
          <p className="text-sm mt-1">Your account manager will set up automation rules for your campaigns.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                Active ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map((r) => <RuleRow key={r.id} rule={r} />)}
              </div>
            </div>
          )}
          {disabled.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                Disabled ({disabled.length})
              </h2>
              <div className="space-y-3">
                {disabled.map((r) => <RuleRow key={r.id} rule={r} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
