"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

const links = [
  { href: "/#services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
]

export function Nav() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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

        <div className="hidden md:block">
          <Link href="/contact">
            <Button className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-5">Book Free Audit</Button>
          </Link>
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
          <Link href="/contact" onClick={() => setOpen(false)}>
            <Button className="w-full rounded-full bg-indigo-600 hover:bg-indigo-500 text-white">Book Free Audit</Button>
          </Link>
        </div>
      )}
    </header>
  )
}
