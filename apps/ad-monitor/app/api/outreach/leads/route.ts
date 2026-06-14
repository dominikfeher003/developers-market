import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { readPotentialClients, writePotentialClients } from "@/lib/storage"
import { PotentialClient } from "@/lib/types"

export async function GET() {
  const clients = await readPotentialClients()
  return NextResponse.json({ clients })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Bulk import: { leads: [...] }
  if (Array.isArray(body.leads)) {
    const now = new Date().toISOString()
    const existing = await readPotentialClients()
    const existingEmails = new Set(existing.map((c) => c.email.toLowerCase()))

    const incoming: PotentialClient[] = body.leads
      .filter((l: Partial<PotentialClient>) => {
        if (!l.email || typeof l.email !== "string") return false
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email)) return false
        return !existingEmails.has(l.email.toLowerCase())
      })
      .map((l: Partial<PotentialClient>) => ({
        id: `lead_${nanoid()}`,
        firstName: String(l.firstName ?? "").trim(),
        lastName: String(l.lastName ?? "").trim(),
        email: String(l.email).trim(),
        title: String(l.title ?? "").trim(),
        company: String(l.company ?? "").trim(),
        website: String(l.website ?? "").trim(),
        country: String(l.country ?? "").trim(),
        language: String(l.language ?? "English").trim().slice(0, 40) || "English",
        status: "pending" as const,
        scheduledFor: null,
        sentAt: null,
        notes: "",
        addedAt: now,
      }))

    await writePotentialClients([...existing, ...incoming])
    return NextResponse.json({ added: incoming.length, skipped: body.leads.length - incoming.length })
  }

  // Single add
  const { firstName, lastName, email, title, company, website, country, language } = body
  const emailStr = String(email ?? "").trim()
  if (emailStr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
  }

  const client: PotentialClient = {
    id: `lead_${nanoid()}`,
    firstName: String(firstName ?? "").trim(),
    lastName: String(lastName ?? "").trim(),
    email: emailStr,
    title: String(title ?? "").trim(),
    company: String(company ?? "").trim(),
    website: String(website ?? "").trim(),
    country: String(country ?? "").trim(),
    language: String(language ?? "English").trim().slice(0, 40) || "English",
    status: "pending",
    scheduledFor: null,
    sentAt: null,
    notes: "",
    addedAt: new Date().toISOString(),
  }

  const existing = await readPotentialClients()
  existing.push(client)
  await writePotentialClients(existing)
  return NextResponse.json({ client }, { status: 201 })
}
