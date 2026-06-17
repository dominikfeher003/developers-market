import { NextRequest, NextResponse } from "next/server"
import { getDb, projects, clients, eq, desc } from "@dm/db"

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId")
  const rows = clientId
    ? await getDb().select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt))
    : await getDb().select().from(projects).orderBy(desc(projects.createdAt))
  return NextResponse.json({ projects: rows })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    clientId: string; name: string; description?: string
    status?: string; progress?: number; deadline?: string; tags?: string[]
  }
  const { clientId, name, description, status, progress, deadline, tags } = body

  if (!clientId || !name?.trim()) {
    return NextResponse.json({ error: "clientId and name are required" }, { status: 400 })
  }

  const clientRows = await getDb().select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1)
  if (clientRows.length === 0) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const id = `prj_${crypto.randomUUID()}`
  await getDb().insert(projects).values({
    id, clientId, name: name.trim(),
    description: description ?? "",
    status: (status as "active" | "review" | "completed" | "on-hold") ?? "active",
    progress: progress ?? 0,
    deadline: deadline ?? null,
    tags: tags ?? [],
  })

  return NextResponse.json({ id })
}
