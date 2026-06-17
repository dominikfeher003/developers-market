import { MessageSquare } from "lucide-react"
import { getPortalT } from "@/lib/i18n/server"
import { tr } from "@/lib/i18n/en"
import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { getDb, supportTickets, eq, desc } from "@dm/db"
import { SupportClient } from "@/components/support/SupportClient"

export default async function SupportPage() {
  const [client, t] = await Promise.all([getUserClient(), getPortalT()])
  if (!client) redirect("/dashboard")

  const rows = await getDb()
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.clientId, client.id))
    .orderBy(desc(supportTickets.updatedAt))

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

      <SupportClient initialTickets={rows} t={t} emptyIcon={MessageSquare} />
    </div>
  )
}
