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

// ---- Blob helpers (portal sync for shared data) ----

const BLOB_FILES = new Set(["clients.json", "rules.json", "alerts.json"])

function blobSyncEnabled(filename: string): boolean {
  return BLOB_FILES.has(filename) && !!process.env.BLOB_READ_WRITE_TOKEN
}

function blobPushBackground<T>(filename: string, data: T): void {
  if (!blobSyncEnabled(filename)) return
  import("@vercel/blob").then(({ put }) =>
    put(`admonitor/${filename}`, JSON.stringify(data, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      contentType: "application/json",
    })
  ).catch((err) => console.error(`[blob] sync failed for ${filename}:`, err))
}

// ---- File helpers ----

async function fileRead<T>(filename: string): Promise<T> {
  const fs = await import("fs/promises")
  const path = await import("path")
  const DATA_DIR = path.join(process.cwd(), "data")
  await fs.mkdir(DATA_DIR, { recursive: true })
  const filePath = path.join(DATA_DIR, filename)
  try {
    const content = await fs.readFile(filePath, "utf8")
    return JSON.parse(content) as T
  } catch {
    const def = getDefault(filename)
    if (def !== undefined) {
      await fileWrite(filename, def)
      return def as T
    }
    throw new Error(`File not found and no default: ${filename}`)
  }
}

async function fileWrite<T>(filename: string, data: T): Promise<void> {
  const fs = await import("fs/promises")
  const path = await import("path")
  const DATA_DIR = path.join(process.cwd(), "data")
  await fs.mkdir(DATA_DIR, { recursive: true })
  const filePath = path.join(DATA_DIR, filename)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8")
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
