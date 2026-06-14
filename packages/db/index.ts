import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set.\n" +
      "1. Go to Vercel → Storage → Create Neon Postgres database\n" +
      "2. Connect it to all 3 projects (ad-monitor, client-portal, developers-market)\n" +
      "3. Run: vercel env pull apps/ad-monitor/.env.local --cwd apps/ad-monitor\n" +
      "4. Run: npx drizzle-kit push from packages/db/"
    )
  }
  return drizzle(neon(url), { schema })
}

export * from "./schema"
export { eq, desc, asc, and, or, inArray, gte, lte, not, count, sum, sql } from "drizzle-orm"
export type { InferSelectModel, InferInsertModel } from "drizzle-orm"
