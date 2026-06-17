import { MessageSquare, AlertCircle } from "lucide-react"
import { getPortalT } from "@/lib/i18n/server"
import { tr } from "@/lib/i18n/en"
import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { getDb, supportTickets, eq, desc } from "@dm/db"
import { SupportClient } from "@/components/support/SupportClient"

type DbTicket = {
  id: string
  number: string
  title: string
  category: string
  status: string
  priority: string
  messages: unknown
  createdAt: Date
  updatedAt: Date
  clientId: string
}

export default async function SupportPage() {
  const [client, t] = await Promise.all([getUserClient(), getPortalT()])
  if (!client) redirect("/dashboard")

  let rows: DbTicket[] = []
  let dbError: string | null = null

  try {
    const result = await getDb()
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.clientId, client.id))
      .orderBy(desc(supportTickets.updatedAt))
    rows = result as DbTicket[]
  } catch (err) {
    console.error("[SupportPage] DB query failed:", err)
    dbError = err instanceof Error ? err.message : String(err)
  }

  const open = rows.filter((r) => r.status === "open" || r.status === "in-progress")
  const openCountStr = tr(open.length === 1 ? t.support.count1 : t.support.countN, { n: open.length })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.support.heading}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{openCountStr}</p>
        </div>
      </div>

      {dbError && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Could not load support tickets</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{dbError}</p>
            <p className="text-xs text-muted-foreground mt-2">If the table is missing, run <code className="bg-muted px-1 rounded text-[11px]">npm run db:push --workspace=@dm/db</code></p>
          </div>
        </div>
      )}

      <SupportClient initialTickets={rows} t={t} emptyIcon={MessageSquare} />
    </div>
  )
}
