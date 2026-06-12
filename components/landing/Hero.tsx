import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Tag chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8">
          <Zap className="h-3.5 w-3.5" />
          AI-Powered Ad Management
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6">
          We Run Your Ads.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            You Run Your Business.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          We manage Facebook, Instagram, and TikTok campaigns for growing businesses — with an AI agent that optimises 24/7, so you never leave money on the table.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/contact">
            <Button size="lg" className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-12 text-base gap-2">
              Book a Free Audit <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="rounded-full border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 px-8 h-12 text-base">
              See Pricing
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
