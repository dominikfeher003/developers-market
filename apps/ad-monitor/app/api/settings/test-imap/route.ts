import { NextResponse } from "next/server"
import { ImapFlow } from "imapflow"
import { readSettings } from "@/lib/storage"

export async function POST() {
  const settings = await readSettings()
  const { smtpUser, smtpPass } = settings
  const imapHost = settings.imapHost || "mail.privateemail.com"
  const imapPort = settings.imapPort || 993

  if (!smtpUser || !smtpPass) {
    return NextResponse.json({ ok: false, msg: "SMTP username or password is empty — fill them in and save first." })
  }

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
    logger: false,
  })

  try {
    await client.connect()
    const mailbox = await client.mailboxOpen("INBOX")
    const count = mailbox.exists ?? 0
    return NextResponse.json({ ok: true, msg: `Connected to ${imapHost} — INBOX has ${count} message${count !== 1 ? "s" : ""}` })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, msg: message })
  } finally {
    try { await client.logout() } catch { /* ignore */ }
  }
}
