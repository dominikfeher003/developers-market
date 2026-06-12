import { BarChart3, Globe } from "lucide-react"

const services = [
  {
    icon: BarChart3,
    title: "Paid Advertising",
    platforms: ["Facebook", "Instagram", "TikTok"],
    description: "Full-funnel campaign management across all major platforms. We handle strategy, creatives, targeting, daily optimisation, and scaling — so your ROAS compounds month over month.",
    features: ["Campaign structure & setup", "Creative briefs & copy", "Daily AI optimisation", "A/B testing at scale", "Weekly performance reports"],
  },
  {
    icon: Globe,
    title: "Website Management",
    platforms: ["Landing Pages", "Speed", "Conversions"],
    description: "Your ads are only as good as the page they send traffic to. We build and manage high-converting landing pages, fix speed issues, and optimise every step of your funnel.",
    features: ["Landing page design & build", "Page speed optimisation", "Conversion rate optimisation", "Pixel & tracking setup", "Ongoing A/B testing"],
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="py-24 max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">What we do</p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white">Two services. One goal: growth.</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {services.map(({ icon: Icon, title, platforms, description, features }) => (
          <div key={title} className="bg-[#111115] border border-white/5 rounded-2xl p-8 hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-indigo-600/10">
                <Icon className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {platforms.map((p) => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">{p}</span>
              ))}
            </div>
            <p className="text-zinc-400 mb-6 leading-relaxed">{description}</p>
            <ul className="space-y-2">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
