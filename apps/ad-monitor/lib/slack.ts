import { Alert } from "./types"

const ACTION_EMOJI: Record<string, string> = {
  pause: "⏸️",
  resume: "▶️",
  scale_budget: "📈",
  notify_only: "🔔",
}

export async function sendSlackAlert(alerts: Alert[], webhookUrl: string): Promise<void> {
  const lines = alerts
    .slice(0, 10)
    .map((a) => {
      const emoji = ACTION_EMOJI[a.action] ?? "⚡"
      return `${emoji} *${a.action.replace("_", " ")}* — ${a.campaignName} (${a.metricName}: ${a.metricValue.toFixed(2)})`
    })
    .join("\n")

  const body = {
    text: `*Ad Monitor fired ${alerts.length} action${alerts.length !== 1 ? "s" : ""}*\n${lines}`,
    username: "Ad Monitor",
    icon_emoji: ":robot_face:",
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export async function sendSlackTest(webhookUrl: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "✅ *Slack connected to Ad Monitor* — you'll receive campaign alerts here.",
        username: "Ad Monitor",
        icon_emoji: ":robot_face:",
      }),
    })
    if (!res.ok) return { ok: false, error: `Slack returned ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
