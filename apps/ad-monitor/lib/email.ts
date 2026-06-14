import nodemailer from "nodemailer"
import { Alert, Settings } from "./types"

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export async function sendAlertEmail(alerts: Alert[], settings: Settings): Promise<{ sent: boolean; error?: string }> {
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass || !settings.notificationEmail) {
    return { sent: false, error: "SMTP not configured" }
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpPort === 465,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
  })

  const rows = alerts
    .map(
      (a) =>
        `<tr>
          <td style="padding:8px;border:1px solid #e5e7eb">${esc(a.campaignName)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb">${esc(a.ruleName)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb">${esc(a.action)}${a.actionValue ? ` (${esc(a.actionValue)}%)` : ""}</td>
          <td style="padding:8px;border:1px solid #e5e7eb">${esc(a.metricName)}: ${esc(a.metricValue.toFixed(2))}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;color:${a.status === "success" ? "#16a34a" : "#dc2626"}">${esc(a.status)}</td>
        </tr>`
    )
    .join("")

  const html = `
    <h2 style="font-family:sans-serif">Ad Monitor: ${alerts.length} rule${alerts.length !== 1 ? "s" : ""} fired</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;width:100%">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Campaign</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Rule</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Action</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Metric</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-family:sans-serif;color:#6b7280;font-size:12px;margin-top:16px">Ad Monitor — ${new Date().toUTCString()}</p>
  `

  try {
    await transporter.sendMail({
      from: settings.smtpUser,
      to: settings.notificationEmail,
      subject: `Ad Monitor: ${alerts.length} rule${alerts.length !== 1 ? "s" : ""} fired`,
      html,
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, error: String(err) }
  }
}
