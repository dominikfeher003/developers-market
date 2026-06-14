"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { FadeIn } from "@/components/ui/FadeIn"
import { useI18n } from "@/lib/i18n/context"

const prices = ["$1,500", "$2,500", "$4,999"]
const popular = [false, true, false]

export function PricingCards() {
  const { t } = useI18n()
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6">
      {t.pricing.tiers.map(({ name, description, features }, i) => (
        <FadeIn key={name} delay={i * 0.12}>
          <div
            className={`relative rounded-2xl p-8 flex flex-col h-full hover:-translate-y-2 transition-all duration-300 ${
              popular[i]
                ? "bg-indigo-600/10 border-2 border-indigo-500/60 shadow-xl shadow-indigo-500/20 popular-card"
                : "bg-[#0e0e14] border border-white/[0.08] hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
            }`}
          >
            {popular[i] && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-indigo-600 text-white border-0 px-4 py-1 text-xs font-semibold">{t.pricing.mostPopular}</Badge>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
              <p className="text-zinc-500 text-sm mb-4">{description}</p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-extrabold text-white">{prices[i]}</span>
                <span className="text-zinc-500 mb-1.5">{t.pricing.perMonth}</span>
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/contact">
              <Button
                className={`w-full rounded-full ${popular[i] ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-white/5 hover:bg-white/10 text-white border border-white/10"} hover:scale-[1.02] active:scale-95 transition-transform`}
              >
                {t.pricing.getStarted}
              </Button>
            </Link>
          </div>
        </FadeIn>
      ))}
    </div>
  )
}
