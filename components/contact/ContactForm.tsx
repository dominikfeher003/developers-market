"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export function ContactForm() {
  const { t } = useI18n()
  const [form, setForm] = useState({
    name: "", email: "", business: "", type: "", budget: "", message: "",
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="h-14 w-14 text-indigo-400 mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">{t.contactForm.successHeading}</h3>
        <p className="text-zinc-400">{t.contactForm.successSub}</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-zinc-300">{t.contactForm.fullName}</Label>
          <Input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Jane Smith"
            className="bg-white border-white/20 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300">{t.contactForm.email}</Label>
          <Input
            required
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="jane@business.com"
            className="bg-white border-white/20 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300">{t.contactForm.businessName}</Label>
        <Input
          required
          value={form.business}
          onChange={(e) => set("business", e.target.value)}
          placeholder="Acme Co."
          className="bg-white border-white/20 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-zinc-300">{t.contactForm.businessType}</Label>
          <Select onValueChange={(v: string | null) => v && set("type", v)}>
            <SelectTrigger className="bg-white border-white/20 text-zinc-900">
              <SelectValue placeholder={t.contactForm.selectType} />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-200 text-zinc-900">
              <SelectItem value="ecommerce">{t.contactForm.types.ecommerce}</SelectItem>
              <SelectItem value="local">{t.contactForm.types.local}</SelectItem>
              <SelectItem value="coach">{t.contactForm.types.coach}</SelectItem>
              <SelectItem value="saas">{t.contactForm.types.saas}</SelectItem>
              <SelectItem value="other">{t.contactForm.types.other}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300">{t.contactForm.budget}</Label>
          <Select onValueChange={(v: string | null) => v && set("budget", v)}>
            <SelectTrigger className="bg-white border-white/20 text-zinc-900">
              <SelectValue placeholder={t.contactForm.selectBudget} />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-200 text-zinc-900">
              <SelectItem value="under1k">{t.contactForm.budgets.under1k}</SelectItem>
              <SelectItem value="1k-5k">{t.contactForm.budgets["1k5k"]}</SelectItem>
              <SelectItem value="5k-20k">{t.contactForm.budgets["5k20k"]}</SelectItem>
              <SelectItem value="20k+">{t.contactForm.budgets["20k"]}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300">{t.contactForm.message} <span className="text-zinc-600">{t.contactForm.messageOptional}</span></Label>
        <Textarea
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder={t.contactForm.messagePlaceholder}
          rows={4}
          className="bg-white border-white/20 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-indigo-600 hover:bg-indigo-500 text-white h-12 text-base gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? t.contactForm.submitting : t.contactForm.submit}
      </Button>
    </form>
  )
}
