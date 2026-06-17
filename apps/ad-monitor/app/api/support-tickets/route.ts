import { NextRequest, NextResponse } from "next/server"
import { getDb, supportTickets, clients, eq, desc } from "@dm/db"

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId")
  const rows = clientId
    ? await getDb().select().from(supportTickets).where(eq(supportTickets.clientId, clientId)).orderBy(desc(supportTickets.updatedAt))
    : await getDb().select().from(supportTickets).orderBy(desc(supportTickets.updatedAt))

  // Attach client names
  const allClients = await getDb().select({ id: clients.id, name: clients.name }).from(clients)
  const clientMap = new Map(allClients.map((c) => [c.id, c.name]))

  const withNames = rows.map((r) => ({ ...r, clientName: clientMap.get(r.clientId) ?? r.clientId }))
  return NextResponse.json({ tickets: withNames })
}
