import { Bot, BarChart2, Rocket, ShieldCheck } from "lucide-react"

const reasons = [
  {
    icon: Bot,
    title: "AI-Powered",
    description: "Our custom agent monitors every campaign every morning. It acts while your competitors are still waking up.",
  },
  {
    icon: BarChart2,
    title: "Fully Transparent",
    description: "You get live dashboard access. No black-box reporting, no hiding bad numbers. You always know exactly what's happening.",
  },
  {
    icon: Rocket,
    title: "Launch in 5 Days",
    description: "We move fast. From onboarding call to live campaigns in 5 business days — not 3 weeks like the big agencies.",
  },
  {
    icon: ShieldCheck,
    title: "60-Day Guarantee",
    description: "If we don't beat your current ROAS in 60 days, you don't pay for month two. We put our money where our mouth is.",
  },
]

export function WhyUs() {
  return (
    <section className="py-24 max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">Why us</p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white">Built different.</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {reasons.map(({ icon: Icon, title, description }) => (
          <div key={title} className="bg-[#111115] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/20 transition-colors">
            <div className="p-2.5 rounded-xl bg-indigo-600/10 w-fit mb-4">
              <Icon className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
