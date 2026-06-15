# Project Architecture

## What This Project Is

A **digital advertising agency toolset** — two web apps that share one database:

- **Ad Monitor** — your internal dashboard. You use this to manage clients, automate campaign rules, monitor spend, and send reports.
- **Client Portal** — what your clients log into to see their own campaign performance.

Both apps read and write to the same Neon Postgres database. That shared database is the central truth of the entire system.

---

## The Monorepo — Why Everything Lives in One Folder

This is a **monorepo**: multiple apps in one Git repository.

```
developers-market/          ← root (one git repo)
├── apps/
│   ├── ad-monitor/         ← App 1: your internal dashboard
│   └── client-portal/      ← App 2: what clients see
├── packages/
│   ├── db/                 ← the shared database layer
│   └── shared/             ← shared TypeScript types
├── package.json            ← declares workspaces
└── node_modules/           ← all packages installed here
```

**Why?** Because both apps share the same database and data types. Without a monorepo you'd have to copy-paste database code into both apps and keep them in sync manually. With **npm workspaces** (declared in root `package.json`), both apps can `import from "@dm/db"` and always get the same version of the same code.

npm workspaces tells Node: *"treat `packages/*` and `apps/*` as named local packages you can import by their package name."*

---

## The Database Package (`packages/db`) — The Spine

Everything else depends on this package. Three files matter:

### `schema.ts` — what tables exist

| Table | What it stores |
|-------|---------------|
| `settings` | Global agency config: Meta ad account ID, SMTP credentials, Slack webhook, agent schedule |
| `clients` | Your advertising clients and their ad platform credentials |
| `clientUsers` | Maps Clerk user IDs to clients, with a role (admin / viewer) |
| `rules` | Automation rules — "if ROAS < 1.5, pause campaign" |
| `alerts` | Log of every time a rule fired and what it did |
| `campaignSnapshots` | Daily metrics per campaign (spend, impressions, clicks, ROAS) |
| `potentialClients` | B2B leads you're prospecting |
| `outreachHistory` | Log of every outreach email sent |
| `reportLogs` | Log of when reports were sent to each client |
| `kvCache` | Generic key-value cache for arbitrary JSON blobs |

### `index.ts` — the connection factory

Exports `getDb()`, which opens a connection to Neon Postgres using `DATABASE_URL`. Every API route in both apps calls `getDb()` before touching the database. This is the one function that connects code to data.

### `drizzle.config.ts` — the migration tool config

Config for `drizzle-kit` (a CLI). When you run `npm run db:push` inside `packages/db`, drizzle-kit reads this file, connects to Neon using your `DATABASE_URL`, and alters the real Postgres tables to match whatever is in `schema.ts`.

**Why Drizzle?** You write your schema in TypeScript. The types flow directly into your queries — if you rename a column in `schema.ts`, TypeScript immediately highlights every query that broke.

---

## The Shared Types Package (`packages/shared`)

One file: `index.ts`. It exports TypeScript interfaces (`Campaign`, `Client`, `Rule`, `Alert`, etc.). Both apps import these so they always agree on what shape the data is. No logic lives here — just type definitions.

---

## Ad Monitor (`apps/ad-monitor`) — The Agency Dashboard

A Next.js app that only you and your team use. No login wall — it's an internal tool. This is the control center.

### The `lib/` folder — all the integrations

| File | What it does |
|------|-------------|
| `lib/meta-api.ts` | Calls Meta (Facebook) Ads API to fetch and control campaigns |
| `lib/tiktok-api.ts` | Calls TikTok Ads API |
| `lib/google-ads-api.ts` | Calls Google Ads API |
| `lib/agent.ts` | The automation brain: fetches live metrics, evaluates rules, fires actions |
| `lib/email.ts` | Sends emails via SMTP (Nodemailer) and reads inbox via IMAP |
| `lib/slack.ts` | Posts messages to a Slack webhook |
| `lib/report.ts` | Generates and emails weekly performance reports |
| `lib/storage.ts` | Reads/writes files via Vercel Blob |
| `lib/types.ts` | Local type definitions specific to this app |

### API routes (`app/api/`) — the backend

These are Next.js Route Handlers (the backend). The browser never calls Meta's API directly — it calls your API routes, which then call Meta (or the DB, or Slack). This is important for security: API keys never leave the server.

```
/api/agent/run          ← trigger the automation agent
/api/alerts             ← CRUD for alerts
/api/campaigns          ← list campaigns from ad platforms
/api/campaigns/[id]/action  ← pause or resume a specific campaign
/api/clients            ← CRUD for your client accounts
/api/clients/[id]/users ← manage which Clerk users can see a client
/api/insights           ← campaign metrics
/api/outreach/*         ← lead gen: find emails, send outreach, inbox
/api/report/send        ← send weekly report
/api/rules              ← CRUD for automation rules
/api/settings           ← read/write global settings
```

### Pages (`app/`) — what you see

Each page is a React component that fetches from the API routes above and renders the result using components from `components/`.

### Example flow — pausing a campaign

```
You click "Pause" in the browser
  → POST /api/campaigns/[id]/action
    → route.ts calls getDb() → reads client's Meta credentials
    → calls lib/meta-api.ts → Meta API pauses the campaign
    → writes a record to the alerts table
    → returns { success: true }
  → page updates the UI
```

---

## Client Portal (`apps/client-portal`) — What Clients See

A Next.js app your clients log into to see their own data: campaign metrics, notifications, rules, invoices, settings.

### The key difference: Clerk authentication

This app uses **Clerk** (`@clerk/nextjs`) for auth. Clerk handles sign-up, sign-in, sessions, and password resets. Every page under `/dashboard` is protected — unauthenticated users are redirected to `/sign-in`.

### How Clerk connects to your database

1. Client logs in → Clerk gives you their `userId` (a string like `user_2abc...`)
2. Your `clientUsers` table has a row: `clerkUserId = "user_2abc..." → clientId = 3, role = "viewer"`
3. The page queries `clientUsers` to find which client's data to show

This is why `clientUsers` exists in the database — it's the bridge between Clerk's auth world and your clients' data.

### No custom API routes

Client Portal reads data directly in Server Components using `getDb()` from `@dm/db`. There's no custom `/api` layer here — the pages talk to the database directly (server-side only, so credentials are never exposed).

### Example flow — client views campaigns

```
Client logs in via Clerk → /dashboard/campaigns
  → Server Component runs (on Vercel's servers, not the browser)
  → Gets Clerk userId from session
  → Calls getDb() → queries clientUsers WHERE clerkUserId = userId
  → Gets clientId = 3
  → Queries campaignSnapshots WHERE clientId = 3
  → Renders the data as HTML → sent to browser
```

---

## Environment Variables — The Connective Tissue

Neither app works without the right env vars. They're stored in `.env.local` files (never committed to Git) and synced from Vercel with `vercel env pull`.

| Variable | Where | What it does |
|----------|-------|-------------|
| `DATABASE_URL` | ad-monitor `.env.local` | Pooled Neon Postgres connection (runtime queries) |
| `DATABASE_URL_UNPOOLED` | ad-monitor `.env.local` | Direct Neon connection (drizzle-kit migrations only) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | client-portal `.env.local` | Clerk public key — safe for the browser |
| `CLERK_SECRET_KEY` | client-portal `.env.local` | Clerk secret key — server only, never exposed |

**Why two DATABASE_URLs?** Neon uses a connection pooler (PgBouncer) that handles many concurrent short-lived connections efficiently — good for serverless. But `drizzle-kit` needs a direct connection to run schema migrations. Two URLs, two use cases.

**Why are Meta/Slack credentials in the DB, not .env?** Because you want to be able to update them in the Settings UI without redeploying the app. Anything that should be changeable at runtime lives in the `settings` table. Anything that never changes at runtime (Clerk keys, DATABASE_URL) lives in `.env.local`.

---

## Full Data Flow Diagram

```
                    ┌────────────────────────┐
                    │    Neon Postgres DB     │
                    │    (packages/db)        │
                    │                         │
                    │  settings               │
                    │  clients                │
                    │  clientUsers            │
                    │  rules / alerts         │
                    │  campaignSnapshots      │
                    │  outreach / reports     │
                    └──────────┬──────────────┘
                               │ getDb()
               ┌───────────────┴───────────────┐
               │                               │
       ┌───────▼────────┐             ┌────────▼────────┐
       │   ad-monitor   │             │  client-portal  │
       │                │             │                 │
       │  API routes    │             │  Server pages   │
       │  lib/ integrs. │             │  Clerk auth     │
       │  (your team)   │             │  (your clients) │
       └───────┬────────┘             └─────────────────┘
               │
    ┌──────────▼───────────┐
    │  External Services   │
    │  Meta Ads API        │
    │  TikTok Ads API      │
    │  Google Ads API      │
    │  Slack webhooks      │
    │  SMTP / IMAP email   │
    │  Anthropic (Claude)  │
    │  Vercel Blob storage │
    └──────────────────────┘
```

---

## How a New Feature Flows (The Mental Model)

Whenever you add anything to the system, follow this order:

1. **Schema first** — does this need a new table or column? Edit `packages/db/schema.ts`
2. **Push to DB** — run `npm run db:push` in `packages/db` to update the real tables
3. **Fetch the data** — if it comes from an ad platform, add it to the relevant `lib/*.ts` file in ad-monitor
4. **Expose via API** — write or update an API route in `apps/ad-monitor/app/api/`
5. **Display it** — update or create a component in `components/`, use it in the page
6. **Client-facing?** — if clients should see it, repeat steps 4-5 in `apps/client-portal/`

**The database is always step 1.** Code without a schema change is just imagination.

---

## Quick Reference: Which File to Touch

| I want to... | Go to |
|-------------|-------|
| Add/change a database table | `packages/db/schema.ts` |
| Change how DB connects | `packages/db/index.ts` |
| Add a Meta/TikTok/Google integration | `apps/ad-monitor/lib/*-api.ts` |
| Add a new internal API endpoint | `apps/ad-monitor/app/api/[name]/route.ts` |
| Add a new internal page | `apps/ad-monitor/app/[name]/page.tsx` |
| Change what clients see | `apps/client-portal/app/dashboard/*/page.tsx` |
| Change the automation rules engine | `apps/ad-monitor/lib/agent.ts` |
| Change email/Slack behavior | `apps/ad-monitor/lib/email.ts` or `lib/slack.ts` |
| Change shared TypeScript types | `packages/shared/index.ts` |
| Add/update environment variables | Vercel dashboard → `vercel env pull` to sync locally |
