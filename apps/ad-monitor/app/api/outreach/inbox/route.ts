import { NextRequest, NextResponse } from "next/server"
import { ImapFlow } from "imapflow"
import { readSettings, readOutreachHistory, readInboxCache, writeInboxCache } from "@/lib/storage"
import { InboxEntry } from "@/lib/types"

const CACHE_TTL_MS = 5 * 60 * 1000

// Decode quoted-printable encoding, handling multi-byte UTF-8 sequences correctly
function decodeQP(s: string): string {
  // Remove soft line breaks
  const joined = s.replace(/=\r?\n/g, "")
  // Replace consecutive =XX hex runs as UTF-8 bytes
  return joined.replace(/((?:=[0-9A-Fa-f]{2})+)/g, (match) => {
    const bytes = (match.match(/=[0-9A-Fa-f]{2}/g) ?? []).map((h) => parseInt(h.slice(1), 16))
    try { return Buffer.from(bytes).toString("utf8") } catch { return match }
  })
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

// Extract readable plain text from a raw MIME body (the TEXT section returned by IMAP)
function extractTextBody(raw: string): string {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  // Detect multipart boundary
  const boundaryMatch = text.match(/^--([\S]+)/m)
  if (boundaryMatch) {
    const sep = "\n--" + boundaryMatch[1]
    const parts = text.split(sep)
    for (const part of parts) {
      if (!/content-type:\s*text\/plain/i.test(part)) continue
      const bodyStart = part.indexOf("\n\n")
      if (bodyStart === -1) continue
      let body = part.slice(bodyStart + 2)
      // Trim trailing boundary marker
      const endIdx = body.indexOf("\n--")
      if (endIdx !== -1) body = body.slice(0, endIdx)
      body = body.trim()
      if (/content-transfer-encoding:\s*quoted-printable/i.test(part)) {
        body = decodeQP(body)
      }
      return body
    }
    // No text/plain found — try first HTML part as fallback
    for (const part of parts) {
      if (!/content-type:\s*text\/html/i.test(part)) continue
      const bodyStart = part.indexOf("\n\n")
      if (bodyStart === -1) continue
      let body = part.slice(bodyStart + 2)
      const endIdx = body.indexOf("\n--")
      if (endIdx !== -1) body = body.slice(0, endIdx)
      if (/content-transfer-encoding:\s*quoted-printable/i.test(part)) {
        body = decodeQP(body)
      }
      return stripHtml(body)
    }
  }

  // Non-multipart: decode QP if needed, then strip HTML if present
  const isQP = /content-transfer-encoding:\s*quoted-printable/i.test(text.slice(0, 400))
  const bodyStart = text.indexOf("\n\n")
  let body = bodyStart !== -1 ? text.slice(bodyStart + 2) : text
  if (isQP) body = decodeQP(body)
  if (body.includes("<html") || body.includes("<body")) body = stripHtml(body)
  return body.trim()
}

export async function GET(req: NextRequest) {
  const refresh = req.nextUrl.searchParams.get("refresh") === "1"

  if (!refresh) {
    const cache = await readInboxCache()
    if (cache.fetchedAt) {
      const age = Date.now() - new Date(cache.fetchedAt).getTime()
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ entries: cache.entries, fetchedAt: cache.fetchedAt, fromCache: true })
      }
    }
  }

  const settings = await readSettings()
  const { smtpUser, smtpPass } = settings
  const imapHost = settings.imapHost || "mail.privateemail.com"
  const imapPort = settings.imapPort || 993

  if (!smtpUser || !smtpPass) {
    return NextResponse.json({ error: "IMAP credentials not configured — set SMTP username and password in Settings.", entries: [] }, { status: 400 })
  }

  const history = await readOutreachHistory()
  const leadMap = new Map<string, { company: string; name: string }>()
  for (const entry of history) {
    leadMap.set(entry.to.toLowerCase(), { company: entry.company, name: entry.toName })
  }

  if (leadMap.size === 0) {
    return NextResponse.json({ entries: [], fetchedAt: new Date().toISOString(), fromCache: false })
  }

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
    logger: false,
  })

  const entries: InboxEntry[] = []

  try {
    await client.connect()
    await client.mailboxOpen("INBOX")

    const since = new Date()
    since.setDate(since.getDate() - 60)

    const searchResult = await client.search({ since }, { uid: true })
    const allUids = Array.isArray(searchResult) ? searchResult : []
    const uids = allUids.slice(-300)

    if (uids.length > 0) {
      type MatchedMsg = {
        uid: number
        fromAddr: string
        lead: { company: string; name: string }
        subject: string
        date: Date
      }
      const matched: MatchedMsg[] = []

      // Pass 1: collect envelopes — fetch loop must complete before any download
      for await (const msg of client.fetch(uids, { envelope: true, uid: true }, { uid: true })) {
        const envelope = msg.envelope
        if (!envelope) continue
        const fromAddr = envelope.from?.[0]?.address?.toLowerCase() ?? ""
        const lead = leadMap.get(fromAddr)
        if (!lead) continue
        matched.push({
          uid: msg.uid,
          fromAddr,
          lead,
          subject: envelope.subject || "(no subject)",
          date: envelope.date instanceof Date ? envelope.date : new Date(envelope.date ?? Date.now()),
        })
      }

      // Pass 2: download and decode body for each matched message
      for (const { uid, fromAddr, lead, subject, date } of matched) {
        let body = ""
        try {
          const dl = await client.download(String(uid), "TEXT", { uid: true })
          if (dl?.content) {
            const chunks: Buffer[] = []
            for await (const chunk of dl.content) chunks.push(chunk as Buffer)
            const raw = Buffer.concat(chunks).toString("binary")
            body = extractTextBody(raw)
          }
        } catch {
          body = ""
        }

        const preview = body.slice(0, 200).replace(/\s+/g, " ").trim()

        entries.push({
          uid,
          from: fromAddr,
          fromName: lead.name || fromAddr,
          subject,
          preview,
          body,
          receivedAt: date.toISOString(),
          read: false,
          leadCompany: lead.company,
        })
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message, entries: [] }, { status: 500 })
  } finally {
    try { await client.logout() } catch { /* ignore */ }
  }

  entries.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())

  const fetchedAt = new Date().toISOString()
  await writeInboxCache({ fetchedAt, entries })

  return NextResponse.json({ entries, fetchedAt, fromCache: false })
}
