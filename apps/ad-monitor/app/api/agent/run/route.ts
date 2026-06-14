import { NextRequest, NextResponse } from "next/server"
import { runAgent } from "@/lib/agent"

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  const secret = process.env.AGENT_CRON_SECRET
  // Only reject if auth header is explicitly provided with the wrong value.
  // Browser button sends no header → allowed. External cron sends correct Bearer → allowed.
  if (auth && secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runAgent()
  return NextResponse.json(result)
}
