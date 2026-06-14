import { ContactForm } from "@/components/contact/ContactForm"
import { ContactInfo } from "@/components/contact/ContactInfo"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Book a Free Audit — Developer's Market",
  description: "Book your free 30-minute ad audit. No commitment, no pressure.",
}

export default function ContactPage() {
  return (
    <div className="pt-24 md:pt-28 pb-16 max-w-6xl mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <ContactInfo />
        <div className="bg-[#111115] border border-white/5 rounded-2xl p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
