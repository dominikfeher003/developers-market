import { NextRequest, NextResponse } from "next/server"

export interface PlaceResult {
  id: string
  name: string
  address: string
  rating: number | null
  ratingCount: number | null
  website: string
  phone: string
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not configured" }, { status: 500 })
  }

  const { query } = await req.json()
  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "query required" }, { status: 400 })
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.rating",
        "places.userRatingCount",
        "places.websiteUri",
        "places.nationalPhoneNumber",
        "places.businessStatus",
      ].join(","),
    },
    body: JSON.stringify({ textQuery: query.trim(), maxResultCount: 20 }),
  })

  if (!res.ok) {
    const text = await res.text()
    const isDev = process.env.NODE_ENV === "development"
    return NextResponse.json({ error: isDev ? text : "Places API error" }, { status: 502 })
  }

  const data = await res.json()

  const places: PlaceResult[] = (data.places ?? [])
    .filter((p: Record<string, unknown>) => p.businessStatus !== "CLOSED_PERMANENTLY")
    .map((p: Record<string, unknown>) => ({
      id: String(p.id ?? ""),
      name: (p.displayName as { text?: string } | undefined)?.text ?? "",
      address: String(p.formattedAddress ?? ""),
      rating: typeof p.rating === "number" ? p.rating : null,
      ratingCount: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
      website: String(p.websiteUri ?? ""),
      phone: String(p.nationalPhoneNumber ?? ""),
    }))

  return NextResponse.json({ places })
}
