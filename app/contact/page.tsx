import { ContactForm } from "@/components/contact/ContactForm"
import { Mail, Clock, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Book a Free Audit — Developer's Market",
  description: "Book your free 30-minute ad audit. No commitment, no pressure.",
}

export default function ContactPage() {
  return (
    <div className="pt-28 pb-16 max-w-6xl mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        {/* Left: info */}
        <div>
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">Get started</p>
          <h1 className="text-5xl font-extrabold text-white mb-5 leading-tight">
            Book your<br />free audit.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-10">
            Tell us about your business and we&apos;ll come back with a full breakdown of what&apos;s working, what isn&apos;t, and exactly how we&apos;d fix it — at no cost.
          </p>
          <div className="space-y-5">
            {[
              { icon: Clock, text: "We respond within 24 hours" },
              { icon: Mail, text: "No spam, ever. Just your audit." },
              { icon: ShieldCheck, text: "No commitment required" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 rounded-lg bg-indigo-600/10 shrink-0">
                  <Icon className="h-4 w-4 text-indigo-400" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div className="bg-[#111115] border border-white/5 rounded-2xl p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
