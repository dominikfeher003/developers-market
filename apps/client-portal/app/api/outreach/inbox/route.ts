import { NextRequest, NextResponse } from "next/server"
import { ImapFlow } from "imapflow"
import {
  getDb,
  settings as settingsTable,
  outreachHistory,
  kvCache,
  eq,
} from "@dm/db"
import { getUserClient } from "@/lib/get-user-client"

const CACHE_TTL_MS = 5 * 60 * 1000

export interface InboxEntry {
  uid: number
  from: string
  fromName: string
  subject: string
  preview: string
  body: string
  receivedAt: string
  leadCompany: string
}

interface InboxCache {
  fetchedAt: string | null
  entries: InboxEntry[]
}

function decodeQP(s: string): string {
  const joined = s.replace(/=\r?\n/g, "")
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

function extractTextBody(raw: string): string {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  const boundaryMatch = text.match(/^--([\S]+)/m)
  if (boundaryMatch) {
    const sep = "\n--" + boundaryMatch[1]
    const parts = text.split(sep)
    for (const part of parts) {
      if (!/content-type:\s*text\/plain/i.test(part)) continue
      const bodyStart = part.indexOf("\n\n")
      if (bodyStart === -1) continue
      let body = part.slice(bodyStart + 2)
      const endIdx = body.indexOf("\n--")
      if (endIdx !== -1) body = body.slice(0, endIdx)
      body = body.trim()
      if (/content-transfer-encoding:\s*quoted-printable/i.test(part)) body = decodeQP(body)
      return body
    }
    for (const part of parts) {
      if (!/content-type:\s*text\/html/i.test(part)) continue
      const bodyStart = part.indexOf("\n\n")
      if (bodyStart === -1) continue
      let body = part.slice(bodyStart + 2)
      const endIdx = body.indexOf("\n--")
      if (endIdx !== -1) body = body.slice(0, endIdx)
      if (/content-transfer-encoding:\s*quoted-printable/i.test(part)) body = decodeQP(body)
      return stripHtml(body)
    }
  }

  const isQP = /content-transfer-encoding:\s*quoted-printable/i.test(text.slice(0, 400))
  const bodyStart = text.indexOf("\n\n")
  let body = bodyStart !== -1 ? text.slice(bodyStart + 2) : text
  if (isQP) body = decodeQP(body)
  if (body.includes("<html") || body.includes("<body")) body = stripHtml(body)
  return body.trim()
}

async function readCache(key: string): Promise<InboxCache> {
  const rows = await getDb()
    .select({ data: kvCache.data })
    .from(kvCache)
    .where(eq(kvCache.key, key))
    .limit(1)
  return rows.length > 0 ? (rows[0].data as InboxCache) : { fetchedAt: null, entries: [] }
}

async function writeCache(key: string, data: InboxCache): Promise<void> {
  const payload = data as unknown as Record<string, unknown>
  await getDb()
    .insert(kvCache)
    .values({ key, data: payload, updatedAt: new Date() })
    .onConflictDoUpdate({ target: kvCache.key, set: { data: payload, updatedAt: new Date() } })
}

export async function GET(req: NextRequest) {
  try {
  const client = await getUserClient()
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const refresh = req.nextUrl.searchParams.get("refresh") === "1"
  const cacheKey = `inbox-cache-${client.id}`

  if (!refresh) {
    const cache = await readCache(cacheKey)
    if (cache.fetchedAt) {
      const age = Date.now() - new Date(cache.fetchedAt).getTime()
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ entries: cache.entries, fetchedAt: cache.fetchedAt, fromCache: true })
      }
    }
  }

  const settingsRows = await getDb().select().from(settingsTable).where(eq(settingsTable.id, 1)).limit(1)
  const s = settingsRows[0]
  const smtpUser = s?.smtpUser
  const smtpPass = s?.smtpPass
  const imapHost = s?.imapHost || "mail.privateemail.com"
  const imapPort = s?.imapPort || 993

  if (!smtpUser || !smtpPass) {
    return NextResponse.json(
      { error: "IMAP credentials not configured — set SMTP credentials in Ad Monitor Settings.", entries: [] },
      { status: 400 }
    )
  }

  const history = await getDb()
    .select({ toEmail: outreachHistory.toEmail, toName: outreachHistory.toName, company: outreachHistory.company })
    .from(outreachHistory)
    .where(eq(outreachHistory.clientId, client.id))

  const leadMap = new Map<string, { company: string; name: string }>()
  for (const entry of history) {
    leadMap.set(entry.toEmail.toLowerCase(), { company: entry.company, name: entry.toName })
  }

  if (leadMap.size === 0) {
    const fetchedAt = new Date().toISOString()
    await writeCache(cacheKey, { fetchedAt, entries: [] })
    return NextResponse.json({ entries: [], fetchedAt, fromCache: false })
  }

  const imap = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
    logger: false,
  })

  const entries: InboxEntry[] = []

  try {
    await imap.connect()
    await imap.mailboxOpen("INBOX")

    const since = new Date()
    since.setDate(since.getDate() - 60)

    const searchResult = await imap.search({ since }, { uid: true })
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

      for await (const msg of imap.fetch(uids, { envelope: true, uid: true }, { uid: true })) {
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

      for (const { uid, fromAddr, lead, subject, date } of matched) {
        let body = ""
        try {
          const dl = await imap.download(String(uid), "TEXT", { uid: true })
          if (dl?.content) {
            const chunks: Buffer[] = []
            for await (const chunk of dl.content) chunks.push(chunk as Buffer)
            const raw = Buffer.concat(chunks).toString("binary")
            body = extractTextBody(raw)
          }
        } catch {
          body = ""
        }

        entries.push({
          uid,
          from: fromAddr,
          fromName: lead.name || fromAddr,
          subject,
          preview: body.slice(0, 200).replace(/\s+/g, " ").trim(),
          body,
          receivedAt: date.toISOString(),
          leadCompany: lead.company,
        })
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message, entries: [] }, { status: 500 })
  } finally {
    try { await imap.logout() } catch { /* ignore */ }
  }

  entries.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())

  const fetchedAt = new Date().toISOString()
  await writeCache(cacheKey, { fetchedAt, entries })

  return NextResponse.json({ entries, fetchedAt, fromCache: false })
  } catch (outerErr) {
    const message = outerErr instanceof Error ? outerErr.message : String(outerErr)
    console.error("[inbox] unhandled error:", message)
    return NextResponse.json({ error: message, entries: [] }, { status: 500 })
  }
}
