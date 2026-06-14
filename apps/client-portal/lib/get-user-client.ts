import { currentUser } from "@clerk/nextjs/server"
import { Client } from "./types"
import { getDb, clients, clientUsers, eq, and } from "@dm/db"

function rowToClient(
  id: string,
  r: {
    clientName: string
    metaAdAccountId: string
    metaAccessToken: string
    tiktokAdAccountId: string | null
    tiktokAccessToken: string | null
    googleAdsCustomerId: string | null
    googleAdsRefreshToken: string | null
    userEmail: string | null
    enabled: boolean
    createdAt: Date
  }
): Client {
  return {
    id,
    name: r.clientName,
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

export async function getUserClient(): Promise<Client | null> {
  const user = await currentUser()
  if (!user) return null
  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase()
  if (!email) return null

  const db = getDb()

  // Primary: client_users table (multi-user support)
  const rows = await db
    .select({
      clientId: clientUsers.clientId,
      clientName: clients.name,
      metaAdAccountId: clients.metaAdAccountId,
      metaAccessToken: clients.metaAccessToken,
      tiktokAdAccountId: clients.tiktokAdAccountId,
      tiktokAccessToken: clients.tiktokAccessToken,
      googleAdsCustomerId: clients.googleAdsCustomerId,
      googleAdsRefreshToken: clients.googleAdsRefreshToken,
      userEmail: clients.userEmail,
      enabled: clients.enabled,
      createdAt: clients.createdAt,
    })
    .from(clientUsers)
    .innerJoin(clients, eq(clientUsers.clientId, clients.id))
    .where(and(eq(clientUsers.userEmail, email), eq(clients.enabled, true)))
    .limit(1)

  if (rows.length > 0) {
    const r = rows[0]
    return rowToClient(r.clientId, r)
  }

  // Fallback: legacy clients.user_email field
  const legacy = await db
    .select()
    .from(clients)
    .where(and(eq(clients.userEmail, email), eq(clients.enabled, true)))
    .limit(1)

  if (legacy.length === 0) return null
  const c = legacy[0]
  return rowToClient(c.id, {
    clientName: c.name,
    metaAdAccountId: c.metaAdAccountId,
    metaAccessToken: c.metaAccessToken,
    tiktokAdAccountId: c.tiktokAdAccountId,
    tiktokAccessToken: c.tiktokAccessToken,
    googleAdsCustomerId: c.googleAdsCustomerId,
    googleAdsRefreshToken: c.googleAdsRefreshToken,
    userEmail: c.userEmail,
    enabled: c.enabled,
    createdAt: c.createdAt,
  })
}
