"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2 } from "lucide-react"

export function ContactForm() {
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
        <h3 className="text-2xl font-bold text-white mb-2">You&apos;re booked in!</h3>
        <p className="text-zinc-400">We&apos;ll reach out within 24 hours to confirm your free audit. 📅</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-zinc-300">Full name</Label>
          <Input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Jane Smith"
            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300">Email</Label>
          <Input
            required
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="jane@business.com"
            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300">Business name</Label>
        <Input
          required
          value={form.business}
          onChange={(e) => set("business", e.target.value)}
          placeholder="Acme Co."
          className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-zinc-300">Business type</Label>
          <Select onValueChange={(v: string | null) => v && set("type", v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-[#111115] border-white/10 text-white">
              <SelectItem value="ecommerce">eCommerce / Product brand</SelectItem>
              <SelectItem value="local">Local service business</SelectItem>
              <SelectItem value="coach">Coach / Course creator</SelectItem>
              <SelectItem value="saas">SaaS / Software</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300">Monthly ad budget</Label>
          <Select onValueChange={(v: string | null) => v && set("budget", v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select budget" />
            </SelectTrigger>
            <SelectContent className="bg-[#111115] border-white/10 text-white">
              <SelectItem value="under1k">Under $1,000</SelectItem>
              <SelectItem value="1k-5k">$1,000 – $5,000</SelectItem>
              <SelectItem value="5k-20k">$5,000 – $20,000</SelectItem>
              <SelectItem value="20k+">$20,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300">Anything else? <span className="text-zinc-600">(optional)</span></Label>
        <Textarea
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Tell us about your current setup, goals, or any specific challenges..."
          rows={4}
          className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500 resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-indigo-600 hover:bg-indigo-500 text-white h-12 text-base gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Sending..." : "Book My Free Audit →"}
      </Button>
    </form>
  )
}
