import type { Config } from "drizzle-kit"
import { config } from "dotenv"
import path from "path"

// Load .env.local from apps/ad-monitor (where vercel env pull writes to)
config({ path: path.resolve(__dirname, "../../apps/ad-monitor/.env.local") })
// Also load from packages/db/.env if present
config({ path: path.resolve(__dirname, ".env") })

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!url) throw new Error("Set DATABASE_URL_UNPOOLED or DATABASE_URL before running drizzle-kit")

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
} satisfies Config
