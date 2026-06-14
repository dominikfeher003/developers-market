import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

async function fetchWebsiteText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0" },
    })
    const html = await res.text()
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 700)
  } catch {
    return ""
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 })

    const client = new Anthropic({ apiKey })
    const { firstName, lastName, title, company, website, language } = await req.json()

    if (!firstName || typeof firstName !== "string") return NextResponse.json({ error: "firstName required" }, { status: 400 })
    if (!company || typeof company !== "string") return NextResponse.json({ error: "company required" }, { status: 400 })
    if (website) {
      try { new URL(website) } catch { return NextResponse.json({ error: "Invalid website URL" }, { status: 400 }) }
    }

    const safeName = firstName.slice(0, 60)
    const safeLastName = String(lastName ?? "").slice(0, 60)
    const safeTitle = String(title ?? "Business Owner").slice(0, 80)
    const safeCompany = company.slice(0, 100)
    const safeLanguage = typeof language === "string" && language.trim() ? language.trim().slice(0, 40) : "English"

    const websiteContext = website ? await fetchWebsiteText(website) : ""

    const prompt = `Write a cold outreach email in ${safeLanguage} from Dominik at Developer's Market, a digital ad agency (Facebook, Instagram, TikTok, Google Ads + websites). We manage $150k+ monthly ad spend, clients average 2.3x ROAS improvement.

Lead:
- Name: ${safeName} ${safeLastName}
- Title: ${safeTitle}
- Company: ${safeCompany}
${websiteContext ? `- Website info: ${websiteContext}` : ""}

Structure (4 short paragraphs):
1. One sentence hook that references something specific about their business or role. No flattery.
2. Two sentences on a real pain they probably feel: wasted spend, campaigns not converting, hard to know what's working, struggling to scale. Make it feel observed, not generic.
3. Two to three sentences on what we do and why it matters to them. Include that we manage $150k+ monthly and clients average 2.3x ROAS improvement.
4. Exactly this CTA: "Would you be open to a free 15-minute audit of your current ad setup?"

Sign off: "Dominik | Developer's Market"

Hard rules:
- NO em dashes. Use commas, periods, or just rewrite the sentence.
- NO hyphens used as pauses mid-sentence.
- NO words: leverage, synergy, game-changing, unlock, revolutionize, thrilled, excited, delighted, hope this finds you, I wanted to reach out, I came across, I noticed that, look no further, cutting-edge, innovative, robust, seamlessly, streamline, at the end of the day, in today's landscape, in the ever-changing, take your X to the next level.
- Short sentences. Plain vocabulary. No corporate filler.
- Write the way a real 25-year-old agency founder would type an email, not how a marketing department would.
- Subject line: under 55 chars, no ALL CAPS, no exclamation marks, sounds like a colleague not an ad.
- Total body 160-190 words.
- Write the entire email in ${safeLanguage}. If not English, write naturally and idiomatically in that language — do not translate word for word from English. "Dominik" and "Developer's Market" are a name and brand name — keep them as-is in all languages. Translate everything else including the CTA and subject line.

Return only valid JSON: {"subject": "...", "body": "..."}`

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const first = msg.content[0]
    const text = first?.type === "text" ? first.text : ""

    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
      const parsed = JSON.parse(cleaned) as { subject: string; body: string }
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
