import { Client, Rule, Alert } from "./types"
import {
  getDb,
  clients as clientsTable,
  rules as rulesTable,
  alerts as alertsTable,
  asc,
  desc,
} from "@dm/db"

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

export async function readRules(): Promise<Rule[]> {
  const rows = await getDb().select().from(rulesTable).orderBy(asc(rulesTable.createdAt))
  return rows.map((r) => ({
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
  }))
}

export async function readAlerts(): Promise<Alert[]> {
  const rows = await getDb()
    .select()
    .from(alertsTable)
    .orderBy(desc(alertsTable.timestamp))
    .limit(1000)
  return rows.map((r) => ({
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
  }))
}
