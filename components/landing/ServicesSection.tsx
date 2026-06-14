"use client"

import { BarChart3, Globe } from "lucide-react"
import { FadeIn } from "@/components/ui/FadeIn"
import { useI18n } from "@/lib/i18n/context"

export function ServicesSection() {
  const { t } = useI18n()
  const services = [
    {
      icon: BarChart3,
      platforms: ["Facebook", "Instagram", "TikTok"],
      ...t.services.ads,
    },
    {
      icon: Globe,
      platforms: ["Landing Pages", "Speed", "Conversions"],
      ...t.services.web,
    },
  ]
  return (
    <section id="services" className="py-16 md:py-24 max-w-6xl mx-auto px-6">
      <FadeIn className="text-center mb-10 md:mb-16">
        <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">{t.services.eyebrow}</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">{t.services.heading}</h2>
      </FadeIn>
      <div className="grid md:grid-cols-2 gap-6">
        {services.map(({ icon: Icon, title, platforms, description, features }, i) => (
          <FadeIn key={title} delay={i * 0.15}>
            <div className="h-full bg-[#0e0e14] border border-white/[0.08] rounded-2xl p-8 hover:border-indigo-500/40 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-indigo-600/10 group-hover:bg-indigo-600/20 transition-colors">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {platforms.map((p) => (
                  <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/[0.08]">{p}</span>
                ))}
              </div>
              <p className="text-zinc-400 mb-6 leading-relaxed">{description}</p>
              <ul className="space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
