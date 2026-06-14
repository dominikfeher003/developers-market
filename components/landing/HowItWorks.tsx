"use client"

import { FadeIn } from "@/components/ui/FadeIn"
import { useI18n } from "@/lib/i18n/context"

export function HowItWorks() {
  const { t } = useI18n()
  const numbers = ["01", "02", "03"]
  return (
    <section className="py-16 md:py-24 bg-[#0a0a0f] border-y border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-10 md:mb-16">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">{t.howItWorks.eyebrow}</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">{t.howItWorks.heading}</h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {t.howItWorks.steps.map(({ title, description }, i) => (
            <FadeIn key={title} delay={i * 0.15}>
              <div className="relative group">
                <div className="text-6xl md:text-7xl font-black text-indigo-500/15 mb-4 leading-none group-hover:text-indigo-500/25 transition-colors duration-300">{numbers[i]}</div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-zinc-400 leading-relaxed">{description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
