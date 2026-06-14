import { NextResponse } from "next/server"
import { readOutreachHistory } from "@/lib/storage"

export async function GET() {
  const history = await readOutreachHistory()
  return NextResponse.json(history)
}
