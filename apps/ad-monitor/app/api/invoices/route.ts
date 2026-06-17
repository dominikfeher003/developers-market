import { NextRequest, NextResponse } from "next/server"
import { getDb, invoices, clients, eq, desc } from "@dm/db"

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId")
  const query = getDb().select().from(invoices).orderBy(desc(invoices.issuedAt))
  const rows = clientId
    ? await getDb().select().from(invoices).where(eq(invoices.clientId, clientId)).orderBy(desc(invoices.issuedAt))
    : await query
  return NextResponse.json({ invoices: rows })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    clientId: string; number: string; description: string
    amount: number; currency?: string; status: string; issuedAt: string; dueDate: string
  }
  const { clientId, number, description, amount, currency, status, issuedAt, dueDate } = body

  if (!clientId || !number || !issuedAt || !dueDate || amount == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const clientRows = await getDb().select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1)
  if (clientRows.length === 0) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const id = `inv_${crypto.randomUUID()}`
  await getDb().insert(invoices).values({
    id, clientId, number, description: description ?? "",
    amount, currency: currency ?? "USD",
    status: (status as "paid" | "pending" | "overdue") ?? "pending",
    issuedAt, dueDate,
  })

  return NextResponse.json({ id })
}
