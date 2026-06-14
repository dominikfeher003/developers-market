import { NextRequest, NextResponse } from "next/server"
import { updateClientById, deleteClientById, readClients } from "@/lib/storage"
import { Client } from "@/lib/types"

function maskToken(client: Client) {
  return {
    ...client,
    metaAccessToken: client.metaAccessToken ? "****" : "",
    tiktokAccessToken: client.tiktokAccessToken ? "****" : undefined,
    googleAdsRefreshToken: client.googleAdsRefreshToken ? "****" : undefined,
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  // Build the partial update — never overwrite tokens with masked values
  const updates: Partial<Client> = {}
  if (typeof body.name === "string") updates.name = body.name.trim()
  if (typeof body.metaAdAccountId === "string") updates.metaAdAccountId = body.metaAdAccountId.trim()
  if (body.metaAccessToken && body.metaAccessToken !== "****") updates.metaAccessToken = body.metaAccessToken
  if (typeof body.tiktokAdAccountId === "string") updates.tiktokAdAccountId = body.tiktokAdAccountId.trim() || undefined
  if (body.tiktokAccessToken && body.tiktokAccessToken !== "****") updates.tiktokAccessToken = body.tiktokAccessToken
  if (typeof body.googleAdsCustomerId === "string") updates.googleAdsCustomerId = body.googleAdsCustomerId.trim() || undefined
  if (body.googleAdsRefreshToken && body.googleAdsRefreshToken !== "****") updates.googleAdsRefreshToken = body.googleAdsRefreshToken
  if (typeof body.enabled === "boolean") updates.enabled = body.enabled
  if (typeof body.userEmail === "string") updates.userEmail = body.userEmail.trim().toLowerCase()

  const updated = await updateClientById(id, updates)
  if (!updated) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  return NextResponse.json({ client: maskToken(updated) })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const deleted = await deleteClientById(id)
  if (!deleted) return NextResponse.json({ error: "Client not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const clients = await readClients()
  const client = clients.find((c) => c.id === id)
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
  return NextResponse.json({ client: maskToken(client) })
}
