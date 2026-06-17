import { NextRequest, NextResponse } from "next/server"
import { getDb, invoices, eq } from "@dm/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as {
    number?: string; description?: string; amount?: number
    currency?: string; status?: string; issuedAt?: string; dueDate?: string
  }

  const rows = await getDb().select({ id: invoices.id }).from(invoices).where(eq(invoices.id, id)).limit(1)
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await getDb().update(invoices).set({
    ...(body.number !== undefined && { number: body.number }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.amount !== undefined && { amount: body.amount }),
    ...(body.currency !== undefined && { currency: body.currency }),
    ...(body.status !== undefined && { status: body.status as "paid" | "pending" | "overdue" }),
    ...(body.issuedAt !== undefined && { issuedAt: body.issuedAt }),
    ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
  }).where(eq(invoices.id, id))

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getDb().delete(invoices).where(eq(invoices.id, id))
  return NextResponse.json({ ok: true })
}
