"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Globe } from "lucide-react"
import { motion } from "framer-motion"
import { useI18n, LOCALES } from "@/lib/i18n/context"

export function Nav() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const { t, locale, setLocale } = useI18n()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const links = [
    { href: "/#services", label: t.nav.services },
    { href: "/pricing",   label: t.nav.pricing },
    { href: "/contact",   label: t.nav.contact },
  ]

  const currentLocale = LOCALES.find(l => l.code === locale)

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#08080a]/90 backdrop-blur-md border-b border-white/5" : ""}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-white tracking-tight">
          Developer&apos;s Market
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${pathname === href ? "text-white" : "text-zinc-400 hover:text-white"}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {/* Language switcher */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{currentLocale?.flag}</span>
              <span className="hidden lg:inline">{currentLocale?.label}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-[#111115] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                {LOCALES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLocale(l.code); setLangOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      locale === l.code ? "bg-indigo-600/20 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/contact">
              <Button className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-5">{t.nav.bookAudit}</Button>
            </Link>
          </motion.div>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#111115] border-t border-white/5 px-6 py-4 space-y-4">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="block text-zinc-300 hover:text-white" onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          {/* Mobile language picker */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
            {LOCALES.map(l => (
              <button
                key={l.code}
                onClick={() => { setLocale(l.code); setOpen(false) }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  locale === l.code
                    ? "border-indigo-500/60 bg-indigo-600/20 text-white"
                    : "border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
          <Link href="/contact" onClick={() => setOpen(false)}>
            <Button className="w-full rounded-full bg-indigo-600 hover:bg-indigo-500 text-white">{t.nav.bookAudit}</Button>
          </Link>
        </div>
      )}
    </header>
  )
}
