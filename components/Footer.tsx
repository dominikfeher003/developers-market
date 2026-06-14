"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"

export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="border-t border-white/5 py-10 mt-20">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-bold text-white">Developer&apos;s Market</span>
        <div className="flex gap-6 text-sm text-zinc-500">
          <Link href="/#services" className="hover:text-white transition-colors">{t.nav.services}</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">{t.nav.pricing}</Link>
          <Link href="/contact" className="hover:text-white transition-colors">{t.nav.contact}</Link>
        </div>
        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Developer&apos;s Market. {t.footer.allRights}</p>
      </div>
    </footer>
  )
}
