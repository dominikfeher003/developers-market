import { NextRequest, NextResponse } from "next/server"
import { readPotentialClients, writePotentialClients } from "@/lib/storage"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const clients = await readPotentialClients()
  const idx = clients.findIndex((c) => c.id === id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const current = clients[idx]
  clients[idx] = {
    ...current,
    ...(typeof body.status === "string" ? { status: body.status } : {}),
    ...(Object.prototype.hasOwnProperty.call(body, "scheduledFor") ? { scheduledFor: body.scheduledFor } : {}),
    ...(Object.prototype.hasOwnProperty.call(body, "sentAt") ? { sentAt: body.sentAt } : {}),
    ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
    ...(typeof body.firstName === "string" ? { firstName: body.firstName } : {}),
    ...(typeof body.lastName === "string" ? { lastName: body.lastName } : {}),
    ...(typeof body.title === "string" ? { title: body.title } : {}),
    ...(typeof body.company === "string" ? { company: body.company } : {}),
    ...(typeof body.email === "string" ? { email: body.email } : {}),
    ...(typeof body.website === "string" ? { website: body.website } : {}),
    ...(typeof body.country === "string" ? { country: body.country } : {}),
    ...(typeof body.language === "string" ? { language: body.language } : {}),
  }

  await writePotentialClients(clients)
  return NextResponse.json({ client: clients[idx] })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const clients = await readPotentialClients()
  const filtered = clients.filter((c) => c.id !== id)
  if (filtered.length === clients.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await writePotentialClients(filtered)
  return NextResponse.json({ success: true })
}
