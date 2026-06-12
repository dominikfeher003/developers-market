const steps = [
  {
    number: "01",
    title: "Free Audit",
    description: "We review your current ads, landing pages, and tracking setup. We'll show you exactly what's costing you ROAS — no fluff, no upsell pressure.",
  },
  {
    number: "02",
    title: "We Launch",
    description: "We restructure your campaigns, write new creatives, install proper tracking, and go live within 5 business days. You approve everything before it runs.",
  },
  {
    number: "03",
    title: "We Scale",
    description: "Our AI agent monitors every campaign every morning. It pauses underperformers, scales winners, and alerts you when action is needed — automatically.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-white/[0.01] border-y border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">The process</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">Simple. Fast. Results.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ number, title, description }) => (
            <div key={number} className="relative">
              <div className="text-6xl font-black text-white/5 mb-4 leading-none">{number}</div>
              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-zinc-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
