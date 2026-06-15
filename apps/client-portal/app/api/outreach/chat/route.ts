import { streamText, tool, stepCountIs, generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { NextResponse } from "next/server"
import { getUserClient } from "@/lib/get-user-client"

type PlaceResult = {
  id: string
  name: string
  address: string
  rating: number | null
  website: string
  phone: string
}

async function searchGooglePlaces(query: string): Promise<{ places?: PlaceResult[]; error?: string }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return { error: "Google Places API not configured" }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.websiteUri,places.nationalPhoneNumber,places.businessStatus",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 12 }),
  })

  if (!res.ok) return { error: `Places API error: ${res.status}` }

  const data = await res.json() as { places?: Record<string, unknown>[] }
  const places: PlaceResult[] = (data.places ?? [])
    .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
    .map((p) => ({
      id: String(p.id ?? ""),
      name: (p.displayName as { text?: string } | undefined)?.text ?? "",
      address: String(p.formattedAddress ?? ""),
      rating: typeof p.rating === "number" ? p.rating : null,
      website: String(p.websiteUri ?? ""),
      phone: String(p.nationalPhoneNumber ?? ""),
    }))

  return { places }
}

async function draftEmail(params: {
  businessName: string
  website?: string
  contactName?: string
  contactTitle?: string
  language?: string
}): Promise<{ subject: string; body: string } | { error: string }> {
  let websiteContext = ""
  if (params.website) {
    try {
      const r = await fetch(params.website, {
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "Mozilla/5.0" },
      })
      const html = await r.text()
      websiteContext = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 600)
    } catch { /* skip */ }
  }

  const result = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    prompt: `Write a cold outreach email from Dominik at Developer's Market (digital ad agency specialising in Facebook, Instagram, TikTok and Google Ads). We manage $150k+ monthly ad spend and clients average 2.3x ROAS improvement.

Target: ${params.contactName ? `${params.contactName}${params.contactTitle ? `, ${params.contactTitle}` : ""}` : "Business Owner"} at ${params.businessName}
${websiteContext ? `Website context: ${websiteContext}` : ""}
Language: ${params.language ?? "English"}

Write 4 short paragraphs:
1. One-sentence opening that references something specific about their business
2. Real pain point they probably feel (wasted ad spend, poor conversions, hard to track ROI)
3. What we do and the results (mention $150k+ and 2.3x ROAS)
4. Soft CTA: "Would you be open to a free 15-minute audit of your current ad setup?"

Sign: "Dominik | Developer's Market"

Rules: No em dashes. No hyphens as pauses. No buzzwords. Plain conversational English. 160-190 words. Subject under 55 chars.

Return ONLY valid JSON with no markdown: {"subject": "...", "body": "..."}`,
  })

  try {
    const cleaned = result.text.replace(/```json\n?|\n?```/g, "").trim()
    return JSON.parse(cleaned) as { subject: string; body: string }
  } catch {
    return { subject: `Quick question about ${params.businessName}`, body: result.text }
  }
}

export async function POST(req: Request) {
  const client = await getUserClient()
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as { messages?: Parameters<typeof streamText>[0]["messages"] }
  const messages = body.messages ?? []

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are an outreach assistant for ${client.name}, powered by Developer's Market.

Your job: help the user find businesses to reach out to and craft cold emails that get responses.

When the user describes who they want to target (e.g. "find plumbers in London" or "roofing companies in Miami"), call searchPlaces immediately.
Present results as a numbered list: business name, address, phone, website, rating.
When the user asks to write an email for a specific business, call generateEmail. The email will be shown as a preview.
Be conversational. If the target is vague, ask one clarifying question.`,
    messages,
    tools: {
      searchPlaces: tool({
        description: "Search Google Places for businesses matching a description or location",
        inputSchema: z.object({
          query: z.string().describe("e.g. 'roofing companies in Miami' or 'restaurants in London'"),
        }),
        execute: async ({ query }) => searchGooglePlaces(query),
      }),
      generateEmail: tool({
        description: "Draft a personalized cold outreach email for a specific business",
        inputSchema: z.object({
          businessName: z.string(),
          website: z.string().optional(),
          contactName: z.string().optional(),
          contactTitle: z.string().optional(),
          language: z.string().optional().default("English"),
        }),
        execute: async (params) => draftEmail(params),
      }),
    },
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
