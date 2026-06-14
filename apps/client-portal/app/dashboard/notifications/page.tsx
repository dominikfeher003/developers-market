import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { readAlerts, readRules } from "@/lib/storage"
import { AlertItem } from "@/components/notifications/AlertItem"

export default async function NotificationsPage() {
  const client = await getUserClient()
  if (!client) redirect("/dashboard")

  const [allAlerts, allRules] = await Promise.all([readAlerts(), readRules()])
  const clientRuleIds = new Set(allRules.filter((r) => r.clientId === client.id).map((r) => r.id))
  const alerts = allAlerts.filter((a) => clientRuleIds.has(a.ruleId)).slice(0, 100)

  return (
    <div className="p-4 md:p-6">
      <p className="text-sm text-zinc-500 mb-6">
        {alerts.length} notification{alerts.length !== 1 ? "s" : ""} from your automation rules.
      </p>

      {alerts.length === 0 ? (
        <div className="text-center py-24 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm mt-1">Notifications appear here when your automation rules take action.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm divide-y divide-zinc-100">
          {alerts.map((a) => (
            <div key={a.id} className="px-5">
              <AlertItem alert={a} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
