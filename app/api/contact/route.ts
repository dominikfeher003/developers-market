import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

interface Lead {
  id: string
  name: string
  email: string
  business: string
  type: string
  budget: string
  message: string
  submittedAt: string
}

async function saveLead(lead: Lead) {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import("@vercel/kv")
    const contacts = (await kv.get<Lead[]>("contacts")) ?? []
    contacts.unshift(lead)
    await kv.set("contacts", contacts)
  } else {
    const dataDir = path.join(process.cwd(), "data")
    await fs.mkdir(dataDir, { recursive: true })
    const filePath = path.join(dataDir, "contacts.json")
    let contacts: Lead[] = []
    try {
      contacts = JSON.parse(await fs.readFile(filePath, "utf8"))
    } catch { /* empty file is fine */ }
    contacts.unshift(lead)
    await fs.writeFile(filePath, JSON.stringify(contacts, null, 2), "utf8")
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const lead: Lead = {
    id: `lead_${Date.now()}`,
    name: body.name ?? "",
    email: body.email ?? "",
    business: body.business ?? "",
    type: body.type ?? "",
    budget: body.budget ?? "",
    message: body.message ?? "",
    submittedAt: new Date().toISOString(),
  }
  await saveLead(lead)
  return NextResponse.json({ success: true })
}
