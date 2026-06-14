import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { readClients, writeClients } from "@/lib/storage"
import { Client } from "@/lib/types"

function maskToken(client: Client) {
  return {
    ...client,
    metaAccessToken: client.metaAccessToken ? "****" : "",
    tiktokAccessToken: client.tiktokAccessToken ? "****" : undefined,
  }
}

export async function GET() {
  const clients = await readClients()
  return NextResponse.json({ clients: clients.map(maskToken) })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, metaAdAccountId, metaAccessToken } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 })
  }
  if (!metaAdAccountId || typeof metaAdAccountId !== "string") {
    return NextResponse.json({ error: "metaAdAccountId required" }, { status: 400 })
  }
  if (!metaAccessToken || typeof metaAccessToken !== "string") {
    return NextResponse.json({ error: "metaAccessToken required" }, { status: 400 })
  }

  const client: Client = {
    id: `client_${nanoid()}`,
    name: name.trim(),
    metaAdAccountId: metaAdAccountId.trim(),
    metaAccessToken,
    tiktokAdAccountId: typeof body.tiktokAdAccountId === "string" && body.tiktokAdAccountId.trim() ? body.tiktokAdAccountId.trim() : undefined,
    tiktokAccessToken: typeof body.tiktokAccessToken === "string" && body.tiktokAccessToken.trim() ? body.tiktokAccessToken : undefined,
    enabled: true,
    createdAt: new Date().toISOString(),
    userEmail: typeof body.userEmail === "string" ? body.userEmail.trim().toLowerCase() : "",
  }

  const clients = await readClients()
  clients.push(client)
  await writeClients(clients)

  return NextResponse.json({ client: maskToken(client) }, { status: 201 })
}
