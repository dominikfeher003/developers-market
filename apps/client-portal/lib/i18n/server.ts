import { cookies } from "next/headers"
import { en, type PortalTranslations } from "./en"
import { hu } from "./hu"
import { de } from "./de"
import { es } from "./es"
import { fr } from "./fr"
import { pt } from "./pt"
import { ro } from "./ro"
import { hr } from "./hr"

type PortalLocale = "en" | "hu" | "de" | "es" | "fr" | "pt" | "ro" | "hr"

const localeMap: Record<PortalLocale, PortalTranslations> = { en, hu, de, es, fr, pt, ro, hr }

export async function getPortalT(): Promise<PortalTranslations> {
  const cookieStore = await cookies()
  const locale = (cookieStore.get("portal_lang")?.value ?? "en") as PortalLocale
  return localeMap[locale] ?? en
}
