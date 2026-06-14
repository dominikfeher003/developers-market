import { NextResponse } from "next/server"
import { readSettings } from "@/lib/storage"
import { sendSlackTest } from "@/lib/slack"

export async function POST() {
  const settings = await readSettings()
  if (!settings.slackWebhookUrl) {
    return NextResponse.json({ ok: false, msg: "No Slack webhook URL configured" })
  }
  const result = await sendSlackTest(settings.slackWebhookUrl)
  return NextResponse.json({ ok: result.ok, msg: result.ok ? "Test message sent to Slack" : (result.error ?? "Failed") })
}
