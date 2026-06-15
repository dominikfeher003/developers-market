import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getDb, outreachHistory } from "@dm/db"
import { getUserClient } from "@/lib/get-user-client"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const client = await getUserClient()
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ error: "Email not configured" }, { status: 500 })
  const fromEmail = process.env.OUTREACH_FROM_EMAIL
  if (!fromEmail) return NextResponse.json({ error: "OUTREACH_FROM_EMAIL not set" }, { status: 500 })

  const body = await req.json() as {
    to: string; toName?: string; company?: string; subject: string; body: string
  }
  const { to, toName, company, subject } = body
  const emailBody = body.body

  if (!to || !EMAIL_RE.test(to)) return NextResponse.json({ error: "Invalid recipient email" }, { status: 400 })
  if (!subject || !emailBody) return NextResponse.json({ error: "Subject and body required" }, { status: 400 })

  const fromName = process.env.OUTREACH_FROM_NAME ?? "Dominik | Developer's Market"
  const htmlBody = emailBody
    .split("\n")
    .map((l: string) => l.trim() ? `<p style="margin:0 0 12px;line-height:1.6">${l}</p>` : "")
    .join("")
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:560px;margin:0 auto;padding:24px">${htmlBody}</body></html>`

  const id = `out_${crypto.randomUUID()}`
  const resend = new Resend(resendKey)

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
    })
    if (error) throw new Error(error.message)

    await getDb().insert(outreachHistory).values({
      id,
      clientId: client.id,
      sentAt: new Date().toISOString(),
      toEmail: to,
      toName: toName ?? "",
      company: company ?? "",
      subject,
      status: "sent",
    })

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    await getDb().insert(outreachHistory).values({
      id,
      clientId: client.id,
      sentAt: new Date().toISOString(),
      toEmail: to,
      toName: toName ?? "",
      company: company ?? "",
      subject,
      status: "failed",
      error: msg,
    }).catch(() => {})
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
