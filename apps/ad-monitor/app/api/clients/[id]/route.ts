import { NextRequest, NextResponse } from "next/server"
import { readClients, writeClients } from "@/lib/storage"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const clients = await readClients()
  const idx = clients.findIndex((c) => c.id === id)
  if (idx === -1) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const current = clients[idx]
  clients[idx] = {
    ...current,
    name: typeof body.name === "string" ? body.name.trim() : current.name,
    metaAdAccountId: typeof body.metaAdAccountId === "string" ? body.metaAdAccountId.trim() : current.metaAdAccountId,
    metaAccessToken: body.metaAccessToken && body.metaAccessToken !== "****" ? body.metaAccessToken : current.metaAccessToken,
    enabled: typeof body.enabled === "boolean" ? body.enabled : current.enabled,
    userEmail: typeof body.userEmail === "string" ? body.userEmail.trim().toLowerCase() : current.userEmail,
  }
  await writeClients(clients)

  return NextResponse.json({
    client: { ...clients[idx], metaAccessToken: clients[idx].metaAccessToken ? "****" : "" },
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const clients = await readClients()
  const filtered = clients.filter((c) => c.id !== id)
  if (filtered.length === clients.length) return NextResponse.json({ error: "Client not found" }, { status: 404 })
  await writeClients(filtered)
  return NextResponse.json({ success: true })
}
