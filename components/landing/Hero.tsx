"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { useI18n } from "@/lib/i18n/context"

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const ease = [0.22, 1, 0.36, 1] as const

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

export function Hero() {
  const { t } = useI18n()
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-indigo-600/20 blur-[160px]" />
        <div className="absolute bottom-0 left-[-10%] w-[450px] h-[450px] rounded-full bg-violet-700/10 blur-[120px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
      >
        <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8">
          <Zap className="h-3.5 w-3.5" />
          {t.hero.badge}
        </motion.div>

        <motion.h1 variants={item} className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6">
          {t.hero.line1}<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            {t.hero.line2}
          </span>
        </motion.h1>

        <motion.p variants={item} className="text-base md:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          {t.hero.sub}
        </motion.p>

        <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/contact">
            <Button size="lg" className="rounded-full bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-transform text-white px-8 h-12 text-base gap-2">
              {t.hero.cta} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="rounded-full border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 hover:scale-105 active:scale-95 transition-transform px-8 h-12 text-base">
              {t.hero.seePricing}
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
