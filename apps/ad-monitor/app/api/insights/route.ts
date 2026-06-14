import { NextRequest, NextResponse } from "next/server"
import { readSettings, readClients } from "@/lib/storage"
import { fetchCampaignInsights } from "@/lib/meta-api"

export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get("campaignId")
  const rawDays = parseInt(req.nextUrl.searchParams.get("days") ?? "7")
  const days = Number.isFinite(rawDays) ? Math.min(Math.max(1, rawDays), 90) : 7
  const clientId = req.nextUrl.searchParams.get("clientId")

  if (!campaignId) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 })
  }

  let token: string
  if (clientId) {
    const clients = await readClients()
    const client = clients.find((c) => c.id === clientId)
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
    token = client.metaAccessToken
  } else {
    const settings = await readSettings()
    if (!settings.metaAccessToken) return NextResponse.json({ error: "Not configured" }, { status: 400 })
    token = settings.metaAccessToken
  }

  try {
    const series = await fetchCampaignInsights(campaignId, token, days)
    return NextResponse.json({ series })
  } catch (err) {
    const isDev = process.env.NODE_ENV === "development"
    return NextResponse.json({ error: isDev ? String(err) : "Internal server error" }, { status: 500 })
  }
}
