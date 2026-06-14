import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { nanoid } from "nanoid"
import { appendOutreachEntry } from "@/lib/storage"

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 })
  const resend = new Resend(resendKey)
  let to: string, toName: string, company: string, subject: string, body: string
  try {
    ;({ to, toName, company, subject, body } = await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!to || !EMAIL_RE.test(to)) return NextResponse.json({ error: "Invalid recipient email" }, { status: 400 })
  if (!subject || /[\r\n]/.test(subject)) return NextResponse.json({ error: "Invalid subject" }, { status: 400 })
  if (toName && /[\r\n]/.test(toName)) return NextResponse.json({ error: "Invalid name" }, { status: 400 })
  if (!body || typeof body !== "string") return NextResponse.json({ error: "Body required" }, { status: 400 })

  const fromName = process.env.OUTREACH_FROM_NAME ?? "Dominik | Developer's Market"
  const fromEmail = process.env.OUTREACH_FROM_EMAIL ?? ""

  if (!fromEmail) {
    return NextResponse.json({ error: "OUTREACH_FROM_EMAIL not configured" }, { status: 500 })
  }

  const htmlBody = body
    .split("\n")
    .map((line: string) => line.trim() ? `<p style="margin:0 0 12px 0;line-height:1.6">${line}</p>` : "")
    .join("")

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:560px;margin:0 auto;padding:24px">${htmlBody}</body></html>`

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
    })

    if (error) throw new Error(error.message)

    await appendOutreachEntry({
      id: `out_${nanoid()}`,
      sentAt: new Date().toISOString(),
      to,
      toName,
      company,
      subject,
      status: "sent",
    })

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"

    await appendOutreachEntry({
      id: `out_${nanoid()}`,
      sentAt: new Date().toISOString(),
      to,
      toName,
      company,
      subject,
      status: "failed",
      error: message,
    })

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
