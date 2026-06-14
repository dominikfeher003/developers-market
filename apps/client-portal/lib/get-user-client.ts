import { currentUser } from "@clerk/nextjs/server"
import { readClients } from "./storage"
import { Client } from "./types"

export async function getUserClient(): Promise<Client | null> {
  const user = await currentUser()
  if (!user) return null
  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase()
  if (!email) return null
  const clients = await readClients()
  return clients.find((c) => c.userEmail?.toLowerCase() === email && c.enabled) ?? null
}
