import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-24 max-w-6xl mx-auto px-6">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600/20 via-indigo-600/5 to-transparent border border-indigo-500/20 p-12 md:p-20 text-center">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-[80px]" />
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Ready to scale?</h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto">
            Book your free 30-minute audit. We&apos;ll show you exactly what&apos;s fixable — no commitment required.
          </p>
          <Link href="/contact">
            <Button size="lg" className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-10 h-13 text-base gap-2">
              Book Free Audit <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
