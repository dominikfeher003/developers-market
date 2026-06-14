import { Settings, Rule, Alert, InboxEntry, Client, PotentialClient } from "./types"

const DEFAULTS: Record<string, unknown> = {
  "settings.json": {
    metaAdAccountId: "",
    metaAccessToken: "",
    notificationEmail: "",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    imapHost: "mail.privateemail.com",
    imapPort: 993,
    lastAgentRun: null,
    agentEnabled: true,
  },
  "rules.json": [],
  "alerts.json": [],
  "cache.json": { fetchedAt: null, campaigns: [] },
  "clients.json": [],
  "potential-clients.json": [],
  "outreach-history.json": [],
  "inbox-cache.json": { fetchedAt: null, entries: [] },
}

const CACHE_FILE_DEFAULT = { fetchedAt: null, campaigns: [] }

function getDefault(filename: string): unknown {
  if (filename in DEFAULTS) return DEFAULTS[filename]
  if (/^cache-.+\.json$/.test(filename)) return CACHE_FILE_DEFAULT
  return undefined
}

// Vercel serverless: only /tmp is writable. Local dev: use DATA_DIR env override.
// os.tmpdir() gives the correct temp path cross-platform (/tmp on Linux, C:\Users\...\AppData\Local\Temp on Windows).
import { tmpdir } from "os"
import { join as pathJoin } from "path"
const DATA_DIR = process.env.DATA_DIR ?? pathJoin(tmpdir(), "admonitor-data")
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN
const BLOB_PREFIX = "admonitor"

// ---- Blob helpers ----

async function blobRead(filename: string): Promise<string | null> {
  if (!BLOB_TOKEN) return null
  try {
    const { list } = await import("@vercel/blob")
    const { blobs } = await list({
      prefix: `${BLOB_PREFIX}/${filename}`,
      token: BLOB_TOKEN,
    })
    const blob = blobs.find((b) => b.pathname === `${BLOB_PREFIX}/${filename}`)
    if (!blob) return null
    const res = await fetch(blob.url, {
      headers: { Authorization: `Bearer ${BLOB_TOKEN}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return res.text()
  } catch (err) {
    console.error(`[storage] blob read failed for ${filename}:`, err)
    return null
  }
}

function blobPushBackground<T>(filename: string, data: T): void {
  if (!BLOB_TOKEN) return
  import("@vercel/blob").then(({ put }) =>
    put(`${BLOB_PREFIX}/${filename}`, JSON.stringify(data, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: BLOB_TOKEN!,
      contentType: "application/json",
    })
  ).catch((err) => console.error(`[storage] blob write failed for ${filename}:`, err))
}

// ---- /tmp cache helpers ----

async function tmpRead(filename: string): Promise<string | null> {
  try {
    const fs = await import("fs/promises")
    return await fs.readFile(pathJoin(DATA_DIR, filename), "utf8")
  } catch {
    return null
  }
}

async function tmpWrite(filename: string, text: string): Promise<void> {
  try {
    const fs = await import("fs/promises")
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(pathJoin(DATA_DIR, filename), text, "utf8")
  } catch (err) {
    console.warn(`[storage] tmp write failed for ${filename}:`, err)
  }
}

// ---- Core read/write ----

async function fileRead<T>(filename: string): Promise<T> {
  // 1. Hot /tmp cache
  const cached = await tmpRead(filename)
  if (cached !== null) {
    try { return JSON.parse(cached) as T } catch { /* fall through */ }
  }

  // 2. Blob (persistent across cold starts)
  const remote = await blobRead(filename)
  if (remote !== null) {
    await tmpWrite(filename, remote)
    try { return JSON.parse(remote) as T } catch { /* fall through */ }
  }

  // 3. Default
  const def = getDefault(filename)
  if (def !== undefined) {
    await fileWrite(filename, def)
    return def as T
  }
  throw new Error(`[storage] No data and no default for: ${filename}`)
}

async function fileWrite<T>(filename: string, data: T): Promise<void> {
  const text = JSON.stringify(data, null, 2)
  await tmpWrite(filename, text)
  blobPushBackground(filename, data)
}

// ---- Public API ----

export async function readJSON<T>(filename: string): Promise<T> {
  return fileRead<T>(filename)
}

export async function writeJSON<T>(filename: string, data: T): Promise<void> {
  await fileWrite(filename, data)
}

export async function readSettings(): Promise<Settings> {
  const defaults = DEFAULTS["settings.json"] as Settings
  const saved = await readJSON<Partial<Settings>>("settings.json")
  const clean = Object.fromEntries(
    Object.entries(saved).filter(([, v]) => v !== undefined)
  ) as Partial<Settings>
  return { ...defaults, ...clean }
}

export async function writeSettings(data: Partial<Settings>): Promise<Settings> {
  const current = await readSettings()
  const updated = { ...current, ...data }
  await writeJSON("settings.json", updated)
  return updated
}

export async function readRules(): Promise<Rule[]> {
  return readJSON<Rule[]>("rules.json")
}

export async function appendRule(rule: Rule): Promise<void> {
  const rules = await readRules()
  rules.push(rule)
  await writeJSON("rules.json", rules)
}

export async function updateRule(id: string, updates: Partial<Rule>): Promise<Rule | null> {
  const rules = await readRules()
  const idx = rules.findIndex((r) => r.id === id)
  if (idx === -1) return null
  rules[idx] = { ...rules[idx], ...updates, updatedAt: new Date().toISOString() }
  await writeJSON("rules.json", rules)
  return rules[idx]
}

export async function deleteRule(id: string): Promise<boolean> {
  const rules = await readRules()
  const filtered = rules.filter((r) => r.id !== id)
  if (filtered.length === rules.length) return false
  await writeJSON("rules.json", filtered)
  return true
}

export async function readAlerts(): Promise<Alert[]> {
  return readJSON<Alert[]>("alerts.json")
}

export async function appendAlert(alert: Alert): Promise<void> {
  const alerts = await readAlerts()
  alerts.unshift(alert)
  if (alerts.length > 1000) alerts.splice(1000)
  await writeJSON("alerts.json", alerts)
}

export async function clearAlerts(): Promise<void> {
  await writeJSON("alerts.json", [])
}

export interface OutreachEntry {
  id: string
  sentAt: string
  to: string
  toName: string
  company: string
  subject: string
  status: "sent" | "failed"
  error?: string
}

export async function readOutreachHistory(): Promise<OutreachEntry[]> {
  return readJSON<OutreachEntry[]>("outreach-history.json")
}

export async function appendOutreachEntry(entry: OutreachEntry): Promise<void> {
  const history = await readOutreachHistory()
  history.unshift(entry)
  if (history.length > 2000) history.splice(2000)
  await writeJSON("outreach-history.json", history)
}

interface InboxCache {
  fetchedAt: string | null
  entries: InboxEntry[]
}

export async function readInboxCache(): Promise<InboxCache> {
  return readJSON<InboxCache>("inbox-cache.json")
}

export async function writeInboxCache(data: InboxCache): Promise<void> {
  await writeJSON("inbox-cache.json", data)
}

export async function readClients(): Promise<Client[]> {
  return readJSON<Client[]>("clients.json")
}

export async function writeClients(clients: Client[]): Promise<void> {
  await writeJSON("clients.json", clients)
}

export async function readPotentialClients(): Promise<PotentialClient[]> {
  return readJSON<PotentialClient[]>("potential-clients.json")
}

export async function writePotentialClients(clients: PotentialClient[]): Promise<void> {
  await writeJSON("potential-clients.json", clients)
}
