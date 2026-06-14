import { NextRequest, NextResponse } from "next/server"
import { getDb, clientUsers, eq, and } from "@dm/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rows = await getDb()
    .select({ id: clientUsers.id, userEmail: clientUsers.userEmail, role: clientUsers.role, invitedAt: clientUsers.invitedAt })
    .from(clientUsers)
    .where(eq(clientUsers.clientId, id))
  return NextResponse.json({ users: rows.map((r) => ({ ...r, invitedAt: r.invitedAt.toISOString() })) })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const role = body.role === "admin" ? "admin" : "viewer"

  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  await getDb()
    .insert(clientUsers)
    .values({ clientId: id, userEmail: email, role })
    .onConflictDoUpdate({ target: [clientUsers.clientId, clientUsers.userEmail], set: { role } })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  await getDb()
    .delete(clientUsers)
    .where(and(eq(clientUsers.clientId, id), eq(clientUsers.userEmail, email)))

  return NextResponse.json({ success: true })
}
