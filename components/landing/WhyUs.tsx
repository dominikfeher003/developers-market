"use client"

import { Bot, BarChart2, Rocket, ShieldCheck } from "lucide-react"
import { FadeIn } from "@/components/ui/FadeIn"
import { useI18n } from "@/lib/i18n/context"

const icons = [Bot, BarChart2, Rocket, ShieldCheck]

export function WhyUs() {
  const { t } = useI18n()
  return (
    <section className="py-16 md:py-24 max-w-6xl mx-auto px-6">
      <FadeIn className="text-center mb-10 md:mb-16">
        <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">{t.whyUs.eyebrow}</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">{t.whyUs.heading}</h2>
      </FadeIn>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {t.whyUs.reasons.map(({ title, description }, i) => {
          const Icon = icons[i]
          return (
            <FadeIn key={title} delay={i * 0.1}>
              <div className="h-full bg-[#0e0e14] border border-white/[0.08] rounded-2xl p-6 hover:border-indigo-500/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group">
                <div className="p-2.5 rounded-xl bg-indigo-600/10 group-hover:bg-indigo-600/20 transition-colors w-fit mb-4">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
              </div>
            </FadeIn>
          )
        })}
      </div>
    </section>
  )
}
