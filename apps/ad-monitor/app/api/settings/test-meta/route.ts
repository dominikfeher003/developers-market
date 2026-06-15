import { NextResponse } from "next/server"
import { readSettings } from "@/lib/storage"
import { validateToken, fetchCampaigns } from "@/lib/meta-api"

export async function POST() {
  const settings = await readSettings()

  if (!settings.metaAccessToken) {
    return NextResponse.json({ ok: false, msg: "No access token saved" })
  }
  if (!settings.metaAdAccountId) {
    return NextResponse.json({ ok: false, msg: "No ad account ID saved" })
  }

  const { valid } = await validateToken(settings.metaAccessToken)
  if (!valid) {
    return NextResponse.json({ ok: false, msg: "Access token is invalid or expired" })
  }

  try {
    const campaigns = await fetchCampaigns(settings.metaAdAccountId, settings.metaAccessToken)
    return NextResponse.json({ ok: true, msg: `Connected — ${campaigns.length} campaign(s) found` })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, msg: `Token valid but account error: ${msg}` })
  }
}
