import { NextRequest, NextResponse } from "next/server"
import { getDb, supportTickets, eq, desc } from "@dm/db"
import { getUserClient } from "@/lib/get-user-client"

export interface TicketMessage {
  role: "client" | "agent"
  content: string
  sentAt: string
  authorName: string
}

export async function GET() {
  const client = await getUserClient()
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await getDb()
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.clientId, client.id))
    .orderBy(desc(supportTickets.updatedAt))

  return NextResponse.json({ tickets: rows })
}

export async function POST(req: NextRequest) {
  const client = await getUserClient()
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as { title?: string; category?: string; priority?: string; message?: string }
  const { title, category, priority, message } = body

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
  }

  // Generate ticket number: count existing + 1
  const existing = await getDb()
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .where(eq(supportTickets.clientId, client.id))

  const number = `TKT-${String(existing.length + 1).padStart(3, "0")}`
  const id = `tkt_${crypto.randomUUID()}`
  const now = new Date().toISOString()

  const firstMessage: TicketMessage = {
    role: "client",
    content: message.trim(),
    sentAt: now,
    authorName: client.name,
  }

  await getDb().insert(supportTickets).values({
    id,
    clientId: client.id,
    number,
    title: title.trim(),
    category: category ?? "General",
    status: "open",
    priority: (priority as "low" | "medium" | "high" | "urgent") ?? "medium",
    messages: [firstMessage] as unknown as Record<string, unknown>[],
  })

  return NextResponse.json({ id, number })
}
