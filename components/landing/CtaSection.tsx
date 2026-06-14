"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { FadeIn } from "@/components/ui/FadeIn"
import { useI18n } from "@/lib/i18n/context"

export function CtaSection() {
  const { t } = useI18n()
  return (
    <section className="py-16 md:py-24 max-w-6xl mx-auto px-6">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600/30 via-indigo-600/8 to-transparent border border-indigo-500/25 p-8 sm:p-12 md:p-20 text-center">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
        </div>
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-700/15 blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">{t.cta.heading}</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto">{t.cta.sub}</p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <Link href="/contact">
              <Button size="lg" className="rounded-full bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-transform text-white px-10 h-12 text-base gap-2">
                {t.cta.button} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
