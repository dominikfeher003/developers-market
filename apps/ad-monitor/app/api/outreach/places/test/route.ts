import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, msg: "GOOGLE_PLACES_API_KEY is not set" })
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName",
      },
      body: JSON.stringify({ textQuery: "coffee shop", maxResultCount: 1 }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const googleMsg = (body?.error?.message as string | undefined)
      const status = (body?.error?.status as string | undefined)
      const hint =
        status === "REQUEST_DENIED"
          ? " — Remove the HTTP referrer restriction on your key (server-side calls have no Referer header)"
          : status === "INVALID_ARGUMENT" || status === "PERMISSION_DENIED"
          ? " — Make sure 'Places API (New)' is in the key's allowed APIs (not just the old Places API)"
          : ""
      return NextResponse.json({ ok: false, msg: (googleMsg ?? `HTTP ${res.status}`) + hint })
    }

    const data = await res.json()
    const count = (data.places ?? []).length
    return NextResponse.json({ ok: true, msg: count > 0 ? "Connected — Places API is working" : "Key accepted but returned no results" })
  } catch (err) {
    return NextResponse.json({ ok: false, msg: String(err) })
  }
}
