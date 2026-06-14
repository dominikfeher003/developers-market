import { NextRequest, NextResponse } from "next/server"

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

const SKIP_PREFIXES = ["noreply", "no-reply", "donotreply", "do-not-reply", "mailer-daemon", "postmaster", "bounce"]
const SKIP_DOMAINS = ["sentry.io", "github.com", "slack.com", "stripe.com", "example.com", "test.com",
  "wixpress.com", "squarespace.com", "wordpress.com", "godaddy.com", "amazonaws.com", "cloudflare.com"]
const SKIP_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".css", ".js", ".woff", ".ttf", ".ico"]

function extractEmails(html: string): string[] {
  // Prefer mailto: links — most reliable
  const mailtoRe = /href=["']mailto:([^"'?]+)/gi
  const found = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = mailtoRe.exec(html)) !== null) {
    found.add(m[1].trim().toLowerCase())
  }
  // Also scan raw text
  const raw = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
  const rawMatches = raw.match(EMAIL_RE) ?? []
  for (const e of rawMatches) found.add(e.trim().toLowerCase())

  return [...found].filter(email => {
    const [local, domain] = email.split("@")
    if (!local || !domain) return false
    if (SKIP_PREFIXES.some(p => local.startsWith(p))) return false
    if (SKIP_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`))) return false
    if (SKIP_EXTENSIONS.some(ext => email.endsWith(ext))) return false
    if (domain.split(".").pop()!.length < 2) return false
    return true
  })
}

function isPrivateHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  )
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    redirect: "follow",
  })
  if (!res.ok) return ""
  return res.text()
}

export async function POST(req: NextRequest) {
  try {
    const { website } = await req.json()
    if (!website || typeof website !== "string") {
      return NextResponse.json({ error: "website required" }, { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(website.startsWith("http") ? website : `https://${website}`)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Only http/https allowed" }, { status: 400 })
    }
    if (isPrivateHost(parsed.hostname)) {
      return NextResponse.json({ error: "Private host not allowed" }, { status: 400 })
    }

    const origin = parsed.origin
    const contactPaths = ["/contact", "/contact-us", "/about", "/about-us", "/kontakt", "/impressum"]
    const pagesToFetch = [website, ...contactPaths.map(p => `${origin}${p}`)]

    const htmls = await Promise.allSettled(pagesToFetch.map(url => fetchPage(url)))

    const allEmails: string[] = []
    for (const result of htmls) {
      if (result.status === "fulfilled" && result.value) {
        allEmails.push(...extractEmails(result.value))
      }
    }

    // Deduplicate, then sort: prefer emails matching the site domain first
    const unique = [...new Set(allEmails)]
    const siteDomain = parsed.hostname.replace(/^www\./, "")
    unique.sort((a, b) => {
      const aMatch = a.endsWith(`@${siteDomain}`) || a.includes(`@${siteDomain}`) ? 0 : 1
      const bMatch = b.endsWith(`@${siteDomain}`) || b.includes(`@${siteDomain}`) ? 0 : 1
      return aMatch - bMatch
    })

    return NextResponse.json({ emails: unique.slice(0, 8) })
  } catch (err) {
    const isDev = process.env.NODE_ENV === "development"
    return NextResponse.json({ error: isDev ? String(err) : "Internal server error" }, { status: 500 })
  }
}
