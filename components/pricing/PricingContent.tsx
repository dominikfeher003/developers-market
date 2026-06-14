"use client"

import { useI18n } from "@/lib/i18n/context"

export function PricingContent() {
  const { t } = useI18n()
  return (
    <>
      <div className="text-center mb-16 px-6">
        <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">{t.pricing.eyebrow}</p>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">{t.pricing.heading}</h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">{t.pricing.sub}</p>
      </div>
    </>
  )
}

export function PricingFAQ() {
  const { t } = useI18n()
  return (
    <div className="max-w-2xl mx-auto px-6 mt-16 md:mt-24">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">{t.pricing.faqHeading}</h2>
      <div className="space-y-6">
        {t.pricing.faqs.map(({ q, a }) => (
          <div key={q} className="border-b border-white/5 pb-6">
            <h3 className="font-semibold text-white mb-2">{q}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
