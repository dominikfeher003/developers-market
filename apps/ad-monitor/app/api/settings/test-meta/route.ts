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
    const code = (err as { code?: number }).code

    if (code === 200 || msg.includes("ads_management") || msg.includes("ads_read")) {
      return NextResponse.json({
        ok: false,
        msg: "Token is valid but lacks permission on this ad account.",
        detail: [
          "Fix in Meta Business Manager:",
          "1. Go to business.facebook.com → Settings → Ad Accounts",
          "2. Select your ad account → Users",
          "3. Add your System User with 'Manage campaigns' role",
          "   OR go to Settings → System Users → [User] → Assign Assets → Ad Accounts → toggle 'Manage'",
          "4. Re-generate the System User token and paste it here",
        ].join("\n"),
        raw: msg,
      })
    }

    return NextResponse.json({ ok: false, msg: `Account error: ${msg}` })
  }
}
