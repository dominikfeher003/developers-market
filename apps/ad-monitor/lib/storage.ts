import { Settings, Rule, Alert, Client, PotentialClient } from "./types"
import {
  getDb,
  settings as settingsTable,
  clients as clientsTable,
  rules as rulesTable,
  alerts as alertsTable,
  potentialClients as potentialClientsTable,
  outreachHistory as outreachHistoryTable,
  kvCache,
  eq,
  desc,
  asc,
} from "@dm/db"

// ---- Settings ----

const SETTINGS_DEFAULTS: Settings = {
  metaAdAccountId: "",
  metaAccessToken: "",
  notificationEmail: "",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  imapHost: "mail.privateemail.com",
  imapPort: 993,
  slackWebhookUrl: undefined,
  lastAgentRun: null,
  agentEnabled: true,
}

export async function readSettings(): Promise<Settings> {
  const rows = await getDb().select().from(settingsTable).where(eq(settingsTable.id, 1)).limit(1)
  if (rows.length === 0) return { ...SETTINGS_DEFAULTS }
  const r = rows[0]
  return {
    ...SETTINGS_DEFAULTS,
    metaAdAccountId: r.metaAdAccountId,
    metaAccessToken: r.metaAccessToken,
    notificationEmail: r.notificationEmail,
    smtpHost: r.smtpHost,
    smtpPort: r.smtpPort,
    smtpUser: r.smtpUser,
    smtpPass: r.smtpPass,
    imapHost: r.imapHost,
    imapPort: r.imapPort,
    slackWebhookUrl: r.slackWebhookUrl ?? undefined,
    lastAgentRun: r.lastAgentRun ? r.lastAgentRun.toISOString() : null,
    agentEnabled: r.agentEnabled,
  }
}

export async function writeSettings(data: Partial<Settings>): Promise<Settings> {
  const current = await readSettings()
  const merged = { ...current, ...data }
  const vals = {
    metaAdAccountId: merged.metaAdAccountId,
    metaAccessToken: merged.metaAccessToken,
    notificationEmail: merged.notificationEmail,
    smtpHost: merged.smtpHost,
    smtpPort: merged.smtpPort,
    smtpUser: merged.smtpUser,
    smtpPass: merged.smtpPass,
    imapHost: merged.imapHost,
    imapPort: merged.imapPort,
    slackWebhookUrl: merged.slackWebhookUrl ?? null,
    lastAgentRun: merged.lastAgentRun ? new Date(merged.lastAgentRun) : null,
    agentEnabled: merged.agentEnabled,
  }
  await getDb()
    .insert(settingsTable)
    .values({ id: 1, ...vals })
    .onConflictDoUpdate({ target: settingsTable.id, set: vals })
  return merged
}

// ---- Clients ----

function rowToClient(r: typeof clientsTable.$inferSelect): Client {
  return {
    id: r.id,
    name: r.name,
    metaAdAccountId: r.metaAdAccountId,
    metaAccessToken: r.metaAccessToken,
    tiktokAdAccountId: r.tiktokAdAccountId ?? undefined,
    tiktokAccessToken: r.tiktokAccessToken ?? undefined,
    googleAdsCustomerId: r.googleAdsCustomerId ?? undefined,
    googleAdsRefreshToken: r.googleAdsRefreshToken ?? undefined,
    userEmail: r.userEmail ?? undefined,
    enabled: r.enabled,
    createdAt: r.createdAt.toISOString(),
  }
}

export async function readClients(): Promise<Client[]> {
  const rows = await getDb().select().from(clientsTable).orderBy(asc(clientsTable.createdAt))
  return rows.map(rowToClient)
}

export async function insertClient(client: Client): Promise<void> {
  await getDb().insert(clientsTable).values({
    id: client.id,
    name: client.name,
    metaAdAccountId: client.metaAdAccountId,
    metaAccessToken: client.metaAccessToken,
    tiktokAdAccountId: client.tiktokAdAccountId ?? null,
    tiktokAccessToken: client.tiktokAccessToken ?? null,
    googleAdsCustomerId: client.googleAdsCustomerId ?? null,
    googleAdsRefreshToken: client.googleAdsRefreshToken ?? null,
    userEmail: client.userEmail ?? null,
    enabled: client.enabled,
    createdAt: new Date(client.createdAt),
  })
}

export async function updateClientById(id: string, updates: Partial<Client>): Promise<Client | null> {
  const rows = await getDb().select().from(clientsTable).where(eq(clientsTable.id, id)).limit(1)
  if (rows.length === 0) return null
  const current = rowToClient(rows[0])
  const merged = { ...current, ...updates }
  await getDb()
    .update(clientsTable)
    .set({
      name: merged.name,
      metaAdAccountId: merged.metaAdAccountId,
      metaAccessToken: merged.metaAccessToken,
      tiktokAdAccountId: merged.tiktokAdAccountId ?? null,
      tiktokAccessToken: merged.tiktokAccessToken ?? null,
      googleAdsCustomerId: merged.googleAdsCustomerId ?? null,
      googleAdsRefreshToken: merged.googleAdsRefreshToken ?? null,
      userEmail: merged.userEmail ?? null,
      enabled: merged.enabled,
    })
    .where(eq(clientsTable.id, id))
  return merged
}

export async function deleteClientById(id: string): Promise<boolean> {
  const result = await getDb().delete(clientsTable).where(eq(clientsTable.id, id))
  return (result.rowCount ?? 0) > 0
}

// ---- Rules ----

function rowToRule(r: typeof rulesTable.$inferSelect): Rule {
  return {
    id: r.id,
    clientId: r.clientId,
    name: r.name,
    metric: r.metric as Rule["metric"],
    operator: r.operator as Rule["operator"],
    threshold: r.threshold,
    windowDays: r.windowDays,
    appliesTo: r.appliesTo as Rule["appliesTo"],
    campaignIds: r.campaignIds ?? [],
    action: r.action as Rule["action"],
    actionValue: r.actionValue ?? null,
    enabled: r.enabled,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export async function readRules(): Promise<Rule[]> {
  const rows = await getDb().select().from(rulesTable).orderBy(asc(rulesTable.createdAt))
  return rows.map(rowToRule)
}

export async function appendRule(rule: Rule): Promise<void> {
  await getDb().insert(rulesTable).values({
    id: rule.id,
    clientId: rule.clientId,
    name: rule.name,
    metric: rule.metric,
    operator: rule.operator,
    threshold: rule.threshold,
    windowDays: rule.windowDays,
    appliesTo: rule.appliesTo,
    campaignIds: rule.campaignIds,
    action: rule.action,
    actionValue: rule.actionValue ?? null,
    enabled: rule.enabled,
    createdAt: new Date(rule.createdAt),
    updatedAt: new Date(rule.updatedAt),
  })
}

export async function updateRule(id: string, updates: Partial<Rule>): Promise<Rule | null> {
  const rows = await getDb().select().from(rulesTable).where(eq(rulesTable.id, id)).limit(1)
  if (rows.length === 0) return null
  const now = new Date()
  await getDb()
    .update(rulesTable)
    .set({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.metric !== undefined && { metric: updates.metric }),
      ...(updates.operator !== undefined && { operator: updates.operator }),
      ...(updates.threshold !== undefined && { threshold: updates.threshold }),
      ...(updates.windowDays !== undefined && { windowDays: updates.windowDays }),
      ...(updates.appliesTo !== undefined && { appliesTo: updates.appliesTo }),
      ...(updates.campaignIds !== undefined && { campaignIds: updates.campaignIds }),
      ...(updates.action !== undefined && { action: updates.action }),
      ...(updates.actionValue !== undefined && { actionValue: updates.actionValue }),
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      updatedAt: now,
    })
    .where(eq(rulesTable.id, id))
  const updated = rowToRule(rows[0])
  return { ...updated, ...updates, updatedAt: now.toISOString() }
}

export async function deleteRule(id: string): Promise<boolean> {
  const result = await getDb().delete(rulesTable).where(eq(rulesTable.id, id))
  return (result.rowCount ?? 0) > 0
}

// ---- Alerts ----

function rowToAlert(r: typeof alertsTable.$inferSelect): Alert {
  return {
    id: r.id,
    timestamp: r.timestamp.toISOString(),
    ruleId: r.ruleId,
    ruleName: r.ruleName,
    campaignId: r.campaignId,
    campaignName: r.campaignName,
    action: r.action as Alert["action"],
    actionValue: r.actionValue ?? null,
    metricValue: r.metricValue,
    metricName: r.metricName as Alert["metricName"],
    status: r.status as Alert["status"],
    errorMessage: r.errorMessage ?? null,
    agentRunId: r.agentRunId,
  }
}

export async function readAlerts(): Promise<Alert[]> {
  const rows = await getDb()
    .select()
    .from(alertsTable)
    .orderBy(desc(alertsTable.timestamp))
    .limit(1000)
  return rows.map(rowToAlert)
}

export async function appendAlert(alert: Alert): Promise<void> {
  await getDb().insert(alertsTable).values({
    id: alert.id,
    ruleId: alert.ruleId,
    ruleName: alert.ruleName,
    campaignId: alert.campaignId,
    campaignName: alert.campaignName,
    action: alert.action,
    actionValue: alert.actionValue ?? null,
    metricValue: alert.metricValue,
    metricName: alert.metricName,
    status: alert.status,
    errorMessage: alert.errorMessage ?? null,
    agentRunId: alert.agentRunId,
    timestamp: new Date(alert.timestamp),
  })
}

export async function clearAlerts(): Promise<void> {
  await getDb().delete(alertsTable)
}

// ---- KV Cache (campaign cache, inbox cache) ----

export async function readJSON<T>(key: string): Promise<T | null> {
  const rows = await getDb().select({ data: kvCache.data }).from(kvCache).where(eq(kvCache.key, key)).limit(1)
  return rows.length > 0 ? (rows[0].data as T) : null
}

export async function writeJSON<T>(key: string, data: T): Promise<void> {
  const payload = data as Record<string, unknown>
  await getDb()
    .insert(kvCache)
    .values({ key, data: payload, updatedAt: new Date() })
    .onConflictDoUpdate({ target: kvCache.key, set: { data: payload, updatedAt: new Date() } })
}

// ---- Outreach History ----

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
  const rows = await getDb()
    .select()
    .from(outreachHistoryTable)
    .orderBy(desc(outreachHistoryTable.sentAt))
    .limit(2000)
  return rows.map((r) => ({
    id: r.id,
    sentAt: r.sentAt,
    to: r.toEmail,
    toName: r.toName,
    company: r.company,
    subject: r.subject,
    status: r.status as "sent" | "failed",
    error: r.error ?? undefined,
  }))
}

export async function appendOutreachEntry(entry: OutreachEntry): Promise<void> {
  await getDb().insert(outreachHistoryTable).values({
    id: entry.id,
    sentAt: entry.sentAt,
    toEmail: entry.to,
    toName: entry.toName,
    company: entry.company,
    subject: entry.subject,
    status: entry.status,
    error: entry.error ?? null,
  })
}

// ---- Inbox Cache (stored in kv_cache) ----

export interface InboxEntry {
  uid: number
  from: string
  fromName: string
  subject: string
  preview: string
  body: string
  receivedAt: string
  read: boolean
  leadCompany?: string
}

interface InboxCache {
  fetchedAt: string | null
  entries: InboxEntry[]
}

export async function readInboxCache(): Promise<InboxCache> {
  return (await readJSON<InboxCache>("inbox-cache")) ?? { fetchedAt: null, entries: [] }
}

export async function writeInboxCache(data: InboxCache): Promise<void> {
  await writeJSON("inbox-cache", data)
}

// ---- Potential Clients ----

function rowToPotentialClient(r: typeof potentialClientsTable.$inferSelect): PotentialClient {
  return {
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    title: r.title,
    company: r.company,
    website: r.website,
    country: r.country,
    language: r.language,
    status: r.status as PotentialClient["status"],
    scheduledFor: r.scheduledFor,
    sentAt: r.sentAt,
    notes: r.notes,
    addedAt: r.addedAt,
  }
}

export async function readPotentialClients(): Promise<PotentialClient[]> {
  const rows = await getDb().select().from(potentialClientsTable).orderBy(asc(potentialClientsTable.addedAt))
  return rows.map(rowToPotentialClient)
}

export async function writePotentialClients(clientsList: PotentialClient[]): Promise<void> {
  const db = getDb()
  await db.delete(potentialClientsTable)
  if (clientsList.length === 0) return
  await db.insert(potentialClientsTable).values(
    clientsList.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      title: c.title,
      company: c.company,
      website: c.website,
      country: c.country,
      language: c.language,
      status: c.status,
      scheduledFor: c.scheduledFor,
      sentAt: c.sentAt,
      notes: c.notes,
      addedAt: c.addedAt,
    }))
  )
}

// Kept for backward compat — agent no longer uses file-based client writes
export async function writeClients(_clients: Client[]): Promise<void> {
  // Clients are managed individually via insertClient / updateClientById / deleteClientById
}
