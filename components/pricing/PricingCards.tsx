import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const tiers = [
  {
    name: "Starter",
    price: "$1,500",
    description: "Perfect for businesses just starting with paid ads.",
    features: [
      "1 platform (Meta: Facebook + Instagram)",
      "Up to 5 creatives/month",
      "Campaign setup & restructure",
      "Weekly performance report",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "$2,500",
    description: "The full stack for scaling businesses ready to dominate.",
    features: [
      "Meta + TikTok (all platforms)",
      "Up to 15 creatives/month",
      "Campaign setup & restructure",
      "Basic website management",
      "Weekly performance report",
      "AI agent monitoring (daily)",
      "Priority email support",
    ],
    popular: true,
  },
  {
    name: "Scale",
    price: "$4,999",
    description: "For high-growth brands that need an in-house agency feel.",
    features: [
      "All platforms (Meta + TikTok + Google)",
      "Unlimited creatives",
      "Full website management",
      "Daily performance report",
      "AI agent + manual oversight",
      "Dedicated account manager",
      "Slack channel access",
      "Monthly strategy call",
    ],
    popular: false,
  },
]

export function PricingCards() {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6">
      {tiers.map(({ name, price, description, features, popular }) => (
        <div
          key={name}
          className={`relative rounded-2xl p-8 flex flex-col ${
            popular
              ? "bg-indigo-600/10 border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
              : "bg-[#111115] border border-white/5"
          }`}
        >
          {popular && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-indigo-600 text-white border-0 px-4 py-1 text-xs font-semibold">Most Popular</Badge>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
            <p className="text-zinc-500 text-sm mb-4">{description}</p>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-extrabold text-white">{price}</span>
              <span className="text-zinc-500 mb-1.5">/mo</span>
            </div>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <Link href="/contact">
            <Button
              className={`w-full rounded-full ${popular ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-white/5 hover:bg-white/10 text-white border border-white/10"}`}
            >
              Get Started
            </Button>
          </Link>
        </div>
      ))}
    </div>
  )
}
