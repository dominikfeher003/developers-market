import { StatusBadge } from "@/components/ui/status-badge"
import { Calendar, ArrowUpRight } from "lucide-react"
import { getPortalT } from "@/lib/i18n/server"
import { tr } from "@/lib/i18n/en"

type Project = {
  id: string
  name: string
  description: string
  status: "active" | "review" | "completed" | "on-hold"
  progress: number
  deadline: string
  tags: string[]
}

const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Q3 Meta Ad Strategy",
    description: "Full-funnel campaign strategy for Q3 including creative briefs, audience segmentation, and budget allocation across all Meta platforms.",
    status: "active",
    progress: 65,
    deadline: "2025-08-31",
    tags: ["Meta Ads", "Strategy", "Q3"],
  },
  {
    id: "p2",
    name: "Brand Awareness Campaign",
    description: "Reach-optimized campaign targeting new audiences with video creative across Facebook and Instagram to build top-of-funnel awareness.",
    status: "active",
    progress: 40,
    deadline: "2025-07-15",
    tags: ["Awareness", "Video", "Instagram"],
  },
  {
    id: "p3",
    name: "Retargeting Flow Setup",
    description: "Custom audience creation, pixel event setup, and retargeting campaign configuration for website visitors and engaged social users.",
    status: "review",
    progress: 90,
    deadline: "2025-06-30",
    tags: ["Retargeting", "Pixel", "Conversion"],
  },
  {
    id: "p4",
    name: "Creative Refresh — June",
    description: "New ad creatives, copy variants, and A/B test setup for June. Includes 12 static images, 4 video concepts, and carousel formats.",
    status: "completed",
    progress: 100,
    deadline: "2025-06-01",
    tags: ["Creative", "A/B Testing"],
  },
  {
    id: "p5",
    name: "Analytics Dashboard Setup",
    description: "Custom reporting dashboard setup including cross-channel attribution, ROAS tracking, and weekly automated reporting via email.",
    status: "on-hold",
    progress: 20,
    deadline: "2025-09-01",
    tags: ["Analytics", "Reporting"],
  },
  {
    id: "p6",
    name: "Holiday Campaign Planning",
    description: "Early planning and creative strategy for Q4 holiday campaigns — Black Friday, Cyber Monday, and Christmas promotional periods.",
    status: "active",
    progress: 15,
    deadline: "2025-10-15",
    tags: ["Q4", "Holiday", "Strategy"],
  },
]

export default async function ProjectsPage() {
  const t = await getPortalT()

  const STATUS_MAP: Record<Project["status"], { label: string; variant: "success" | "info" | "neutral" | "warning" }> = {
    active: { label: t.projects.status.active, variant: "success" },
    review: { label: t.projects.status.review, variant: "info" },
    completed: { label: t.projects.status.completed, variant: "neutral" },
    "on-hold": { label: t.projects.status.onHold, variant: "warning" },
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.projects.heading}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{tr(t.projects.subtitle, { n: PROJECTS.length })}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {PROJECTS.map((p) => {
          const status = STATUS_MAP[p.status]
          const deadline = new Date(p.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          const isPast = new Date(p.deadline) < new Date() && p.status !== "completed"
          return (
            <div key={p.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow group">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground leading-snug">{p.name}</h3>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{p.description}</p>

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
                <div className={`flex items-center gap-1 text-xs ${isPast ? "text-red-500" : "text-muted-foreground"}`}>
                  <Calendar className="h-3 w-3" />
                  <span>{deadline}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((tag) => (
                  <span key={tag} className="text-[11px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
