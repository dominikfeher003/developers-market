import { NextRequest, NextResponse } from "next/server"
import { readSettings, readClients } from "@/lib/storage"
import { sendWeeklyReport } from "@/lib/report"
import { getDb, reportLogs } from "@dm/db"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret && secret !== process.env.AGENT_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const targetClientId = url.searchParams.get("clientId")
  const preview = url.searchParams.get("preview") === "1"

  const [settings, clients] = await Promise.all([readSettings(), readClients()])

  const targets = targetClientId
    ? clients.filter((c) => c.id === targetClientId && c.enabled)
    : clients.filter((c) => c.enabled)

  if (targets.length === 0) {
    return NextResponse.json({ ok: false, error: "No enabled clients found" }, { status: 404 })
  }

  const results: { clientId: string; name: string; sent: boolean; error?: string }[] = []

  for (const client of targets) {
    // In preview mode, send only to the admin notification email
    const to = preview ? settings.notificationEmail : undefined
    const result = await sendWeeklyReport(client, client.id, settings, to)
    results.push({ clientId: client.id, name: client.name, ...result })

    if (result.sent && !preview) {
      await getDb().insert(reportLogs).values({
        clientId: client.id,
        reportType: "weekly",
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, results })
}
