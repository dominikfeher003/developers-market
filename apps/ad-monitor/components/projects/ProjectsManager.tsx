"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useActiveClient } from "@/lib/client-context"

interface Project {
  id: string
  clientId: string
  name: string
  description: string
  status: "active" | "review" | "completed" | "on-hold"
  progress: number
  deadline: string | null
  tags: string[]
}

type FormState = Omit<Project, "id" | "clientId" | "tags"> & { tagsRaw: string }

const EMPTY_FORM: FormState = {
  name: "", description: "", status: "active", progress: 0, deadline: "", tagsRaw: "",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  review: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  "on-hold": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}

export function ProjectsManager() {
  const { activeClientId } = useActiveClient()
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const url = activeClientId ? `/api/projects?clientId=${activeClientId}` : "/api/projects"
    const res = await fetch(url)
    const data = await res.json() as { projects: Project[] }
    setItems(data.projects ?? [])
    setLoading(false)
  }, [activeClientId])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm(EMPTY_FORM); setEditingId(null); setShowForm(true)
  }
  function openEdit(p: Project) {
    setForm({
      name: p.name, description: p.description, status: p.status,
      progress: p.progress, deadline: p.deadline ?? "", tagsRaw: p.tags.join(", "),
    })
    setEditingId(p.id); setShowForm(true)
  }

  async function save() {
    if (!activeClientId) { alert("Select a client first"); return }
    if (!form.name.trim()) { alert("Name is required"); return }
    setSaving(true)
    const tags = form.tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    const payload = { name: form.name, description: form.description, status: form.status, progress: form.progress, deadline: form.deadline || null, tags }
    try {
      if (editingId) {
        await fetch(`/api/projects/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      } else {
        await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, clientId: activeClientId }) })
      }
      setShowForm(false); await load()
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm("Delete this project?")) return
    setDeletingId(id)
    await fetch(`/api/projects/${id}`, { method: "DELETE" })
    setDeletingId(null); await load()
  }

  const inp = (k: keyof FormState, type = "text") => ({
    value: String(form[k]),
    type,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: type === "number" ? Number(e.target.value) : e.target.value })),
  })

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {activeClientId ? `${items.length} project${items.length !== 1 ? "s" : ""}` : "Select a client to manage their projects"}
        </p>
        <Button onClick={openCreate} className="gap-1.5" disabled={!activeClientId}>
          <Plus className="h-4 w-4" /> Add Project
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
      ) : !activeClientId ? (
        <div className="text-center py-20 text-zinc-400 border-2 border-dashed rounded-lg">
          <p className="font-medium text-foreground">No client selected</p>
          <p className="text-sm mt-1">Use the client switcher in the sidebar to select a client.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 border-2 border-dashed rounded-lg">
          <p className="font-medium text-foreground">No projects yet</p>
          <p className="text-sm mt-1">Add the first project for this client.</p>
          <Button className="mt-4 gap-1.5" onClick={openCreate}><Plus className="h-4 w-4" /> Add Project</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 space-y-3 group">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground leading-snug">{p.name}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => openEdit(p)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => del(p.id)} disabled={deletingId === p.id} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors">
                    {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span><span className="font-medium text-foreground">{p.progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.status === "completed" ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>
                  {p.status.charAt(0).toUpperCase() + p.status.slice(1).replace("-", " ")}
                </span>
                {p.deadline && <span className="text-[11px] text-muted-foreground">{new Date(p.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
              </div>
              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((tag) => <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{tag}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold">{editingId ? "Edit Project" : "New Project"}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name *</label>
                <input {...inp("name")} placeholder="Q3 Meta Ad Strategy" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="What's this project about?" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                  <select {...inp("status")} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors">
                    <option value="active">Active</option>
                    <option value="review">In Review</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Progress (%)</label>
                  <input {...inp("progress", "number")} min={0} max={100} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Deadline</label>
                  <input {...inp("deadline", "date")} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tags (comma-separated)</label>
                  <input {...inp("tagsRaw")} placeholder="Meta Ads, Strategy, Q3" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? "Save Changes" : "Create Project"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
