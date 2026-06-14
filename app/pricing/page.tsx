import { PricingCards } from "@/components/pricing/PricingCards"
import { PricingContent, PricingFAQ } from "@/components/pricing/PricingContent"
import { CtaSection } from "@/components/landing/CtaSection"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing — Developer's Market",
  description: "Simple, transparent pricing. No hidden fees, no long-term contracts.",
}

export default function PricingPage() {
  return (
    <div className="pt-24 md:pt-28 pb-16">
      <PricingContent />
      <PricingCards />
      <PricingFAQ />
      <CtaSection />
    </div>
  )
}
