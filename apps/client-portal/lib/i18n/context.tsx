"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { en, type PortalTranslations } from "./en"
import { hu } from "./hu"
import { de } from "./de"
import { es } from "./es"
import { fr } from "./fr"
import { pt } from "./pt"
import { ro } from "./ro"
import { hr } from "./hr"

export type PortalLocale = "en" | "hu" | "de" | "es" | "fr" | "pt" | "ro" | "hr"

export const PORTAL_LOCALES: { code: PortalLocale; label: string; flag: string }[] = [
  { code: "en", label: "English",   flag: "🇬🇧" },
  { code: "hu", label: "Magyar",    flag: "🇭🇺" },
  { code: "de", label: "Deutsch",   flag: "🇩🇪" },
  { code: "es", label: "Español",   flag: "🇪🇸" },
  { code: "fr", label: "Français",  flag: "🇫🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ro", label: "Română",    flag: "🇷🇴" },
  { code: "hr", label: "Hrvatski",  flag: "🇭🇷" },
]

const localeMap: Record<PortalLocale, PortalTranslations> = { en, hu, de, es, fr, pt, ro, hr }

interface PortalI18nCtx {
  locale: PortalLocale
  setLocale: (l: PortalLocale) => void
  t: PortalTranslations
}

const PortalI18nContext = createContext<PortalI18nCtx>({
  locale: "en",
  setLocale: () => {},
  t: en,
})

export function PortalLanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<PortalLocale>("en")

  useEffect(() => {
    const stored = localStorage.getItem("portal_lang") as PortalLocale | null
    if (stored && localeMap[stored]) setLocaleState(stored)
  }, [])

  function setLocale(l: PortalLocale) {
    setLocaleState(l)
    localStorage.setItem("portal_lang", l)
    document.cookie = `portal_lang=${l}; path=/; max-age=31536000; SameSite=Lax`
  }

  return (
    <PortalI18nContext.Provider value={{ locale, setLocale, t: localeMap[locale] }}>
      {children}
    </PortalI18nContext.Provider>
  )
}

export function usePortalI18n() {
  return useContext(PortalI18nContext)
}
