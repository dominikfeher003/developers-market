import { Hero } from "@/components/landing/Hero"
import { ResultsBar } from "@/components/landing/ResultsBar"
import { ServicesSection } from "@/components/landing/ServicesSection"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { WhyUs } from "@/components/landing/WhyUs"
import { CtaSection } from "@/components/landing/CtaSection"

export default function HomePage() {
  return (
    <>
      <Hero />
      <ResultsBar />
      <ServicesSection />
      <HowItWorks />
      <WhyUs />
      <CtaSection />
    </>
  )
}
