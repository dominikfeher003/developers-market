import { NextRequest, NextResponse } from "next/server"
import { readSettings, writeSettings } from "@/lib/storage"

export async function GET() {
  const settings = await readSettings()
  return NextResponse.json({
    ...settings,
    metaAccessToken: settings.metaAccessToken ? "****" : "",
  })
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.smtpPort !== undefined && (typeof body.smtpPort !== "number" || body.smtpPort < 1 || body.smtpPort > 65535)) {
    return NextResponse.json({ error: "Invalid smtpPort" }, { status: 400 })
  }
  if (body.imapPort !== undefined && (typeof body.imapPort !== "number" || body.imapPort < 1 || body.imapPort > 65535)) {
    return NextResponse.json({ error: "Invalid imapPort" }, { status: 400 })
  }
  if (body.notificationEmail && !EMAIL_RE.test(body.notificationEmail)) {
    return NextResponse.json({ error: "Invalid notification email" }, { status: 400 })
  }

  // Never allow overwriting token with masked value
  if (body.metaAccessToken === "****") delete body.metaAccessToken
  const updated = await writeSettings(body)
  return NextResponse.json({
    ...updated,
    metaAccessToken: updated.metaAccessToken ? "****" : "",
  })
}
