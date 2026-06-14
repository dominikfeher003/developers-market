import { NextRequest, NextResponse } from "next/server"
import { readRules, appendRule } from "@/lib/storage"
import { nanoid } from "nanoid"

const VALID_METRICS = new Set<string>(["purchase_roas","spend","impressions","clicks","ctr","reach","frequency","video_views","video_view_rate","engagement_rate","cost_per_engagement","post_likes","post_comments","post_shares"])
const VALID_OPS = new Set<string>(["less_than","greater_than","equals"])
const VALID_ACTIONS = new Set<string>(["pause","resume","scale_budget","notify_only"])

export async function GET() {
  const rules = await readRules()
  return NextResponse.json({ rules })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "name required" }, { status: 400 })
  if (!VALID_METRICS.has(body.metric)) return NextResponse.json({ error: "Invalid metric" }, { status: 400 })
  if (!VALID_OPS.has(body.operator)) return NextResponse.json({ error: "Invalid operator" }, { status: 400 })
  if (!VALID_ACTIONS.has(body.action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  if (!Number.isFinite(Number(body.threshold))) return NextResponse.json({ error: "Invalid threshold" }, { status: 400 })
  const wd = Number(body.windowDays)
  if (!Number.isInteger(wd) || wd < 1 || wd > 365) return NextResponse.json({ error: "windowDays must be 1–365" }, { status: 400 })
  if (body.action === "scale_budget" && !Number.isFinite(Number(body.actionValue))) return NextResponse.json({ error: "scale_budget requires numeric actionValue" }, { status: 400 })

  const now = new Date().toISOString()
  const rule = {
    ...body,
    id: `rule_${nanoid()}`,
    createdAt: now,
    updatedAt: now,
  }
  await appendRule(rule)
  return NextResponse.json(rule, { status: 201 })
}
