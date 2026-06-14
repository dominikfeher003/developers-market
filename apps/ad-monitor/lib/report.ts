import nodemailer from "nodemailer"
import { Settings, Client } from "./types"
import { getDb, alerts as alertsTable, campaignSnapshots, eq, desc, gte } from "@dm/db"

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function fmt(n: number, currency = false): string {
  if (currency) return "$" + n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return n.toLocaleString()
}

export async function generateWeeklyReportHtml(client: Client, clientId: string): Promise<string> {
  const db = getDb()
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const weekAgoStr = weekAgo.toISOString().slice(0, 10)
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().slice(0, 10)

  // 7d snapshots
  const snapshots7d = await db
    .select()
    .from(campaignSnapshots)
    .where(eq(campaignSnapshots.clientId, clientId))
    .orderBy(desc(campaignSnapshots.date))
    .limit(500)

  const currentWeekSnaps = snapshots7d.filter((s) => s.date >= weekAgoStr)
  const priorWeekSnaps = snapshots7d.filter((s) => s.date >= twoWeeksAgoStr && s.date < weekAgoStr)

  const sum7d = currentWeekSnaps.reduce(
    (a, s) => ({ spend: a.spend + s.spend, impressions: a.impressions + s.impressions, roas: a.roas + s.roas }),
    { spend: 0, impressions: 0, roas: 0 }
  )
  const sumPrior = priorWeekSnaps.reduce(
    (a, s) => ({ spend: a.spend + s.spend, impressions: a.impressions + s.impressions, roas: a.roas + s.roas }),
    { spend: 0, impressions: 0, roas: 0 }
  )
  const avgRoas = currentWeekSnaps.length > 0 ? sum7d.roas / currentWeekSnaps.length : 0
  const priorAvgRoas = priorWeekSnaps.length > 0 ? sumPrior.roas / priorWeekSnaps.length : 0

  // Top 5 campaigns by spend this week
  const campaignMap: Record<string, { spend: number; roas: number; count: number; name?: string }> = {}
  for (const s of currentWeekSnaps) {
    if (!campaignMap[s.campaignId]) campaignMap[s.campaignId] = { spend: 0, roas: 0, count: 0 }
    campaignMap[s.campaignId].spend += s.spend
    campaignMap[s.campaignId].roas += s.roas
    campaignMap[s.campaignId].count += 1
  }
  const top5 = Object.entries(campaignMap)
    .sort((a, b) => b[1].spend - a[1].spend)
    .slice(0, 5)

  // Rules fired this week
  const recentAlerts = await db
    .select()
    .from(alertsTable)
    .where(gte(alertsTable.timestamp, weekAgo))
    .limit(200)
  const clientAlerts = recentAlerts // already filtered by period; client filter below
  const actionCounts: Record<string, number> = {}
  for (const a of clientAlerts) {
    actionCounts[a.action] = (actionCounts[a.action] ?? 0) + 1
  }

  function delta(current: number, prior: number): string {
    if (prior === 0) return ""
    const pct = ((current - prior) / prior) * 100
    const sign = pct >= 0 ? "+" : ""
    const color = pct >= 0 ? "#16a34a" : "#dc2626"
    return `<span style="color:${color};font-size:12px;margin-left:6px">${sign}${pct.toFixed(0)}% vs last week</span>`
  }

  const weekLabel = weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " – " + now.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  const topCampaignsRows = top5.map(([_id, c]) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px">${esc(c.name ?? _id)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;text-align:right">${fmt(c.spend, true)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;text-align:right">${c.count > 0 ? (c.roas / c.count).toFixed(2) : "—"}x</td>
    </tr>`
  ).join("")

  const actionRows = Object.entries(actionCounts).map(([action, count]) =>
    `<li style="padding:4px 0;font-size:14px;color:#374151">${action.replace("_", " ")}: <strong>${count}</strong></li>`
  ).join("") || `<li style="padding:4px 0;font-size:14px;color:#6b7280">No rules fired this week</li>`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px">
      <p style="margin:0;color:#c7d2fe;font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Developers Market</p>
      <h1 style="margin:8px 0 4px;color:#fff;font-size:22px;font-weight:700">Weekly Performance Report</h1>
      <p style="margin:0;color:#c7d2fe;font-size:14px">${esc(client.name)} · ${esc(weekLabel)}</p>
    </div>

    <!-- KPIs -->
    <div style="display:flex;gap:1px;background:#f3f4f6">
      <div style="flex:1;background:#fff;padding:20px 24px">
        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;font-weight:600">Total Spend</p>
        <p style="margin:4px 0 0;font-size:26px;font-weight:700;color:#111827">${fmt(sum7d.spend, true)}</p>
        ${delta(sum7d.spend, sumPrior.spend)}
      </div>
      <div style="flex:1;background:#fff;padding:20px 24px">
        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;font-weight:600">Avg ROAS</p>
        <p style="margin:4px 0 0;font-size:26px;font-weight:700;color:#111827">${avgRoas.toFixed(2)}x</p>
        ${delta(avgRoas, priorAvgRoas)}
      </div>
      <div style="flex:1;background:#fff;padding:20px 24px">
        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;font-weight:600">Impressions</p>
        <p style="margin:4px 0 0;font-size:26px;font-weight:700;color:#111827">${fmt(sum7d.impressions)}</p>
        ${delta(sum7d.impressions, sumPrior.impressions)}
      </div>
    </div>

    <!-- Top Campaigns -->
    <div style="padding:24px">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827">Top Campaigns by Spend</h2>
      ${top5.length > 0 ? `
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;text-align:left;font-weight:600">Campaign</th>
            <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;text-align:right;font-weight:600">Spend</th>
            <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;text-align:right;font-weight:600">ROAS</th>
          </tr>
        </thead>
        <tbody>${topCampaignsRows}</tbody>
      </table>` : `<p style="color:#6b7280;font-size:14px">No campaign data yet — the agent needs to run at least once to collect data.</p>`}
    </div>

    <!-- Automation Summary -->
    <div style="padding:0 24px 24px">
      <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#111827">Automation Activity</h2>
      <ul style="margin:0;padding-left:20px">${actionRows}</ul>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 24px;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9ca3af">Managed by <strong style="color:#4f46e5">Developers Market</strong> · Ad Monitor</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendWeeklyReport(
  client: Client,
  clientId: string,
  settings: Settings,
  to?: string
): Promise<{ sent: boolean; error?: string }> {
  const recipient = to ?? client.userEmail ?? settings.notificationEmail
  if (!recipient) return { sent: false, error: "No recipient email configured" }
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    return { sent: false, error: "SMTP not configured" }
  }

  const html = await generateWeeklyReportHtml(client, clientId)
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpPort === 465,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
  })

  try {
    await transporter.sendMail({
      from: settings.smtpUser,
      to: recipient,
      subject: `Weekly Report — ${client.name}`,
      html,
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, error: String(err) }
  }
}
