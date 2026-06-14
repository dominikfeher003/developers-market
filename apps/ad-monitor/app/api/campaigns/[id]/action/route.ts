import { NextRequest, NextResponse } from "next/server"
import { readSettings, readJSON, writeJSON, readClients } from "@/lib/storage"
import { pauseCampaign, resumeCampaign, updateDailyBudget } from "@/lib/meta-api"
import { Campaign } from "@/lib/types"

interface CacheData {
  fetchedAt: string | null
  campaigns: Campaign[]
}

const isDev = process.env.NODE_ENV === "development"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { action, value, clientId } = await req.json()

  if (!["pause", "resume", "set_budget"].includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  }

  if (action === "set_budget") {
    const dollars = Number(value)
    if (!Number.isFinite(dollars) || dollars <= 0 || dollars > 100_000) {
      return NextResponse.json({ error: "Budget must be between $0.01 and $100,000" }, { status: 400 })
    }
  }

  let token: string
  let cacheKey: string

  if (clientId) {
    const clients = await readClients()
    const client = clients.find((c) => c.id === clientId)
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
    token = client.metaAccessToken
    cacheKey = `cache-${clientId}.json`
  } else {
    const settings = await readSettings()
    if (!settings.metaAccessToken) return NextResponse.json({ error: "Not configured" }, { status: 400 })
    token = settings.metaAccessToken
    cacheKey = "cache.json"
  }

  try {
    if (action === "pause") {
      await pauseCampaign(id, token)
    } else if (action === "resume") {
      await resumeCampaign(id, token)
    } else if (action === "set_budget") {
      await updateDailyBudget(id, token, Math.round(Number(value) * 100))
    }

    const cache = await readJSON<CacheData>(cacheKey)
    const campaign = cache.campaigns.find((c) => c.id === id)
    if (campaign) {
      if (action === "pause") campaign.status = "PAUSED"
      if (action === "resume") campaign.status = "ACTIVE"
      if (action === "set_budget") campaign.daily_budget = Math.round(Number(value) * 100)
      await writeJSON(cacheKey, cache)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: isDev ? String(err) : "Internal server error" }, { status: 500 })
  }
}
