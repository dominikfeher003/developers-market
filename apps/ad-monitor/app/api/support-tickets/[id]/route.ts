import { NextRequest, NextResponse } from "next/server"
import { getDb, supportTickets, eq } from "@dm/db"

interface TicketMessage {
  role: "client" | "agent"
  content: string
  sentAt: string
  authorName: string
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await getDb().select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1)
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ticket: rows[0] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as { status?: string; message?: string; priority?: string }

  const rows = await getDb().select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1)
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const ticket = rows[0]
  const existing = (ticket.messages ?? []) as TicketMessage[]

  const newMessages = body.message?.trim()
    ? [...existing, { role: "agent" as const, content: body.message.trim(), sentAt: new Date().toISOString(), authorName: "Developer's Market" }]
    : existing

  await getDb().update(supportTickets).set({
    ...(body.status && { status: body.status as "open" | "in-progress" | "resolved" | "closed" }),
    ...(body.priority && { priority: body.priority as "low" | "medium" | "high" | "urgent" }),
    messages: newMessages as unknown as Record<string, unknown>[],
    updatedAt: new Date(),
  }).where(eq(supportTickets.id, id))

  return NextResponse.json({ ok: true })
}
