"use client"

import { FadeIn } from "@/components/ui/FadeIn"
import { useI18n } from "@/lib/i18n/context"

export function ResultsBar() {
  const { t } = useI18n()
  const stats = [
    { value: "$2.4M+", label: t.results.stat1Label },
    { value: "3.8x",   label: t.results.stat2Label },
    { value: "24/7",   label: t.results.stat3Label },
  ]
  return (
    <section className="border-y border-indigo-500/10 bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        {stats.map(({ value, label }, i) => (
          <FadeIn key={label} delay={i * 0.1}>
            <p className="text-4xl font-extrabold text-white mb-1">{value}</p>
            <p className="text-sm text-zinc-500">{label}</p>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
