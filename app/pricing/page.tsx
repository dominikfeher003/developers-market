import { PricingCards } from "@/components/pricing/PricingCards"
import { CtaSection } from "@/components/landing/CtaSection"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing — Developer's Market",
  description: "Simple, transparent pricing. No hidden fees, no long-term contracts.",
}

const faqs = [
  {
    q: "Do you require a minimum ad spend?",
    a: "We recommend a minimum of $1,000/month in ad spend to see meaningful results, but we work with clients at various stages.",
  },
  {
    q: "How long until I see results?",
    a: "Most clients see ROAS improvement within the first 2–4 weeks. Significant scaling results typically come in months 2–3 as we gather data.",
  },
  {
    q: "What if I already have campaigns running?",
    a: "Perfect — we'll audit what's live, keep what's working, fix what isn't, and build on top of your existing data.",
  },
  {
    q: "Is there a contract?",
    a: "Month-to-month. No long-term commitments. We earn your business every month.",
  },
  {
    q: "What platforms do you manage?",
    a: "Facebook, Instagram, and TikTok on Starter and Growth plans. Scale adds Google Ads. Website management is available on Growth and Scale.",
  },
]

export default function PricingPage() {
  return (
    <div className="pt-28 pb-16">
      <div className="text-center mb-16 px-6">
        <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4">Simple, honest pricing.</h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
          No hidden fees. No long-term contracts. Just results — or we work for free until we deliver them.
        </p>
      </div>

      <PricingCards />

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-6 mt-24">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Common questions</h2>
        <div className="space-y-6">
          {faqs.map(({ q, a }) => (
            <div key={q} className="border-b border-white/5 pb-6">
              <h3 className="font-semibold text-white mb-2">{q}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      <CtaSection />
    </div>
  )
}
