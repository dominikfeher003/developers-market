"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { en, type Translations } from "./en"
import { es } from "./es"
import { fr } from "./fr"
import { de } from "./de"
import { pt } from "./pt"
import { ro } from "./ro"
import { hr } from "./hr"

export type Locale = "en" | "es" | "fr" | "de" | "pt" | "ro" | "hr"

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "es", label: "Español",    flag: "🇪🇸" },
  { code: "fr", label: "Français",   flag: "🇫🇷" },
  { code: "de", label: "Deutsch",    flag: "🇩🇪" },
  { code: "pt", label: "Português",  flag: "🇧🇷" },
  { code: "ro", label: "Română",     flag: "🇷🇴" },
  { code: "hr", label: "Hrvatski",   flag: "🇭🇷" },
]

const localeMap: Record<Locale, Translations> = { en, es, fr, de, pt, ro, hr }

interface I18nCtx {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Translations
}

const I18nContext = createContext<I18nCtx>({ locale: "en", setLocale: () => {}, t: en })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const stored = localStorage.getItem("dm_lang") as Locale | null
    if (stored && localeMap[stored]) setLocaleState(stored)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem("dm_lang", l)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: localeMap[locale] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
