"use client"

import { Mail, Clock, ShieldCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

const icons = [Clock, Mail, ShieldCheck]

export function ContactInfo() {
  const { t } = useI18n()
  return (
    <div>
      <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">{t.contact.eyebrow}</p>
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
        {t.contact.heading1}<br />{t.contact.heading2}
      </h1>
      <p className="text-zinc-400 text-lg leading-relaxed mb-10">{t.contact.sub}</p>
      <div className="space-y-5">
        {t.contact.trust.map((text, i) => {
          const Icon = icons[i]
          return (
            <div key={text} className="flex items-center gap-3 text-zinc-300">
              <div className="p-2 rounded-lg bg-indigo-600/10 shrink-0">
                <Icon className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-sm">{text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
