"use client"

import { createContext, useContext } from "react"
import { Client } from "./types"

export const ClientContext = createContext<Client | null>(null)

export function useClient(): Client {
  const c = useContext(ClientContext)
  if (!c) throw new Error("useClient used outside ClientContext")
  return c
}
