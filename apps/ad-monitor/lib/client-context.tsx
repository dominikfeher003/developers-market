"use client"

import { createContext, useContext, useState, useEffect } from "react"

interface Ctx {
  activeClientId: string | null
  setActiveClient(id: string | null): void
}

export const ClientContext = createContext<Ctx>({
  activeClientId: null,
  setActiveClient: () => {},
})

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [activeClientId, setActiveClientId] = useState<string | null>(null)

  useEffect(() => {
    setActiveClientId(localStorage.getItem("adm_client") ?? null)
  }, [])

  function setActiveClient(id: string | null) {
    setActiveClientId(id)
    if (id) {
      localStorage.setItem("adm_client", id)
    } else {
      localStorage.removeItem("adm_client")
    }
  }

  return (
    <ClientContext.Provider value={{ activeClientId, setActiveClient }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useActiveClient() {
  return useContext(ClientContext)
}
