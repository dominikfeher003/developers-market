import { StatusBadge } from "@/components/ui/status-badge"
import { Calendar, ArrowUpRight } from "lucide-react"
import { getPortalT } from "@/lib/i18n/server"
import { tr } from "@/lib/i18n/en"
import { getUserClient } from "@/lib/get-user-client"
import { redirect } from "next/navigation"
import { getDb, projects as projectsTable, eq, desc } from "@dm/db"

export default async function ProjectsPage() {
  const [client, t] = await Promise.all([getUserClient(), getPortalT()])
  if (!client) redirect("/dashboard")

  const STATUS_MAP: Record<string, { label: string; variant: "success" | "info" | "neutral" | "warning" }> = {
    active: { label: t.projects.status.active, variant: "success" },
    review: { label: t.projects.status.review, variant: "info" },
    completed: { label: t.projects.status.completed, variant: "neutral" },
    "on-hold": { label: t.projects.status.onHold, variant: "warning" },
  }

  const rows = await getDb()
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.clientId, client.id))
    .orderBy(desc(projectsTable.createdAt))

  const activeCount = rows.filter((p) => p.status === "active").length

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.projects.heading}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{tr(t.projects.subtitle, { n: activeCount })}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-foreground">No projects yet</p>
          <p className="text-sm text-muted-foreground mt-1">Active projects from your account manager will appear here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((p) => {
            const status = STATUS_MAP[p.status] ?? STATUS_MAP.active
            const deadline = p.deadline
              ? new Date(p.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : null
            const isPast = p.deadline && new Date(p.deadline) < new Date() && p.status !== "completed"
            const tags = (p.tags ?? []) as string[]
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow group">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">{p.name}</h3>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                </div>

                {p.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{p.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t.projects.progress}</span>
                    <span className="font-medium text-foreground">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${p.status === "completed" ? "bg-emerald-500" : "bg-indigo-500"}`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <StatusBadge variant={status.variant} dot>{status.label}</StatusBadge>
                  {deadline && (
                    <div className={`flex items-center gap-1 text-xs ${isPast ? "text-red-500" : "text-muted-foreground"}`}>
                      <Calendar className="h-3 w-3" />
                      <span>{deadline}</span>
                    </div>
                  )}
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
