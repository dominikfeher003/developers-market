import { NextRequest, NextResponse } from "next/server"
import { getDb, supportTickets, eq, and } from "@dm/db"
import { getUserClient } from "@/lib/get-user-client"
import type { TicketMessage } from "../route"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await getUserClient()
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const rows = await getDb()
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, id), eq(supportTickets.clientId, client.id)))
    .limit(1)

  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ticket: rows[0] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await getUserClient()
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { message?: string }
  const { message } = body

  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 })

  const rows = await getDb()
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, id), eq(supportTickets.clientId, client.id)))
    .limit(1)

  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const ticket = rows[0]
  const existing = (ticket.messages ?? []) as TicketMessage[]
  const newMsg: TicketMessage = {
    role: "client",
    content: message.trim(),
    sentAt: new Date().toISOString(),
    authorName: client.name,
  }

  await getDb()
    .update(supportTickets)
    .set({
      messages: [...existing, newMsg] as unknown as Record<string, unknown>[],
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, id))

  return NextResponse.json({ ok: true })
}
