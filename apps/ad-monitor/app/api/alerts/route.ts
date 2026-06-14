import { NextRequest, NextResponse } from "next/server"
import { readAlerts, clearAlerts } from "@/lib/storage"

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "100")
  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0")
  const alerts = await readAlerts()
  const page = alerts.slice(offset, offset + limit)
  return NextResponse.json({ alerts: page, total: alerts.length })
}

export async function DELETE() {
  await clearAlerts()
  return NextResponse.json({ success: true })
}
