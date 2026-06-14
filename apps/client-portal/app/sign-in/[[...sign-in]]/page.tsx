"use client"

import { SignIn } from "@clerk/nextjs"
import { Zap, TrendingUp, ShieldCheck, ArrowLeft, ExternalLink } from "lucide-react"

const FEATURES = [
  {
    icon: TrendingUp,
    text: "Real-time campaign performance across Meta, Instagram & TikTok",
  },
  {
    icon: Zap,
    text: "Automated rules that pause, resume, and scale your budget 24/7",
  },
  {
    icon: ShieldCheck,
    text: "Your agency team acts on insights before you even notice them",
  },
]

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row">
      {/* Left brand panel */}
      <div className="relative flex flex-col justify-between md:w-[55%] p-10 md:p-16 overflow-hidden">
        {/* Radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          }}
        />
        {/* Dot grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top: wordmark + content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold tracking-tight">DM</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">Developers Market</span>
          </div>

          {/* Hero copy */}
          <div className="space-y-3 max-w-sm">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
              Campaign intelligence,{" "}
              <span className="text-indigo-400">automated.</span>
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed">
              Your dedicated portal for tracking every dollar, every campaign, and every result — all in one place.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-indigo-400" />
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="mt-12 p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 max-w-sm">
            <p className="text-zinc-300 text-sm italic leading-relaxed">
              &ldquo;Having everything in one dashboard means we can act on performance data the same day, not the same week.&rdquo;
            </p>
            <p className="text-zinc-500 text-xs mt-3 font-medium">— E-commerce brand, 6-figure monthly ad spend</p>
          </div>
        </div>

        {/* Bottom: back link */}
        <div className="relative z-10 mt-12 md:mt-0">
          <a
            href="https://www.developers-market.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-200 text-sm transition-colors duration-150 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-150" />
            Back to Developers Market
          </a>
        </div>
      </div>

      {/* Right: sign-in form */}
      <div className="flex flex-col items-center justify-center md:w-[45%] px-6 py-12 md:px-12 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800/60">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-white text-xl font-semibold">Welcome back</h2>
            <p className="text-zinc-500 text-sm mt-1">Sign in to your client portal</p>
          </div>

          <SignIn
            appearance={{
              variables: {
                colorBackground: "#1c1c1f",
                colorPrimary: "#6366f1",
                borderRadius: "0.625rem",
                fontSize: "14px",
              } as Record<string, string>,
              elements: {
                card: "shadow-none !bg-transparent !border-0 !p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "!border-zinc-700 !text-zinc-300 hover:!bg-zinc-800",
                dividerLine: "!bg-zinc-800",
                dividerText: "!text-zinc-600",
                formFieldLabel: "!text-zinc-400",
                formFieldInput: "!border-zinc-700 focus:!border-indigo-500",
                footerActionText: "!text-zinc-500",
                footerActionLink: "!text-indigo-400 hover:!text-indigo-300",
                identityPreviewText: "!text-zinc-300",
                identityPreviewEditButton: "!text-indigo-400",
              },
            }}
          />

          <p className="text-center text-xs text-zinc-600">
            New client?{" "}
            <a
              href="https://www.developers-market.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              Get in touch
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
