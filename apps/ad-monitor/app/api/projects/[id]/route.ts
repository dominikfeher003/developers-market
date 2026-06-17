import { NextRequest, NextResponse } from "next/server"
import { getDb, projects, eq } from "@dm/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as {
    name?: string; description?: string; status?: string
    progress?: number; deadline?: string; tags?: string[]
  }

  const rows = await getDb().select({ id: projects.id }).from(projects).where(eq(projects.id, id)).limit(1)
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await getDb().update(projects).set({
    ...(body.name !== undefined && { name: body.name }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.status !== undefined && { status: body.status as "active" | "review" | "completed" | "on-hold" }),
    ...(body.progress !== undefined && { progress: body.progress }),
    ...(body.deadline !== undefined && { deadline: body.deadline }),
    ...(body.tags !== undefined && { tags: body.tags }),
    updatedAt: new Date(),
  }).where(eq(projects.id, id))

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getDb().delete(projects).where(eq(projects.id, id))
  return NextResponse.json({ ok: true })
}
