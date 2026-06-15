"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Users, X } from "lucide-react"
import { Client } from "@/lib/types"

type MaskedClient = Omit<Client, "metaAccessToken" | "tiktokAccessToken" | "googleAdsRefreshToken"> & {
  metaAccessToken: string
  tiktokAccessToken?: string
  googleAdsRefreshToken?: string
}

interface FormState {
  name: string
  metaAdAccountId: string
  metaAccessToken: string
  userEmail: string
  tiktokAdAccountId: string
  tiktokAccessToken: string
  googleAdsCustomerId: string
  googleAdsRefreshToken: string
}

const EMPTY_FORM: FormState = {
  name: "", metaAdAccountId: "", metaAccessToken: "", userEmail: "",
  tiktokAdAccountId: "", tiktokAccessToken: "",
  googleAdsCustomerId: "", googleAdsRefreshToken: "",
}

interface ClientUser {
  id: number
  userEmail: string
  role: string
  invitedAt: string
}

export function ClientsManager() {
  const [clients, setClients] = useState<MaskedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showTikTok, setShowTikTok] = useState(false)
  const [showGoogle, setShowGoogle] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedUsers, setExpandedUsers] = useState<string | null>(null)
  const [clientUsers, setClientUsers] = useState<Record<string, ClientUser[]>>({})
  const [addUserEmail, setAddUserEmail] = useState("")
  const [addUserRole, setAddUserRole] = useState<"viewer" | "admin">("viewer")
  const [addingUser, setAddingUser] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, "ok" | "fail">>({})

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/clients")
    const data = await res.json()
    setClients(data.clients ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadUsers(clientId: string) {
    const res = await fetch(`/api/clients/${clientId}/users`)
    const data = await res.json()
    setClientUsers((prev) => ({ ...prev, [clientId]: data.users ?? [] }))
  }

  async function addUser(clientId: string) {
    if (!addUserEmail.trim()) return
    setAddingUser(true)
    await fetch(`/api/clients/${clientId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addUserEmail.trim(), role: addUserRole }),
    })
    setAddUserEmail("")
    await loadUsers(clientId)
    setAddingUser(false)
  }

  async function removeUser(clientId: string, email: string) {
    await fetch(`/api/clients/${clientId}/users`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    await loadUsers(clientId)
  }

  function startAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowTikTok(false)
    setShowGoogle(false)
    setShowForm(true)
  }

  function startEdit(client: MaskedClient) {
    setEditingId(client.id)
    setForm({
      name: client.name,
      metaAdAccountId: client.metaAdAccountId,
      metaAccessToken: "",
      userEmail: client.userEmail ?? "",
      tiktokAdAccountId: client.tiktokAdAccountId ?? "",
      tiktokAccessToken: "",
      googleAdsCustomerId: client.googleAdsCustomerId ?? "",
      googleAdsRefreshToken: "",
    })
    setShowTikTok(!!(client.tiktokAdAccountId))
    setShowGoogle(!!(client.googleAdsCustomerId))
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowTikTok(false)
    setShowGoogle(false)
  }

  async function save() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        tiktokAdAccountId: form.tiktokAdAccountId.trim() || undefined,
        tiktokAccessToken: form.tiktokAccessToken.trim() || undefined,
        googleAdsCustomerId: form.googleAdsCustomerId.trim() || undefined,
        googleAdsRefreshToken: form.googleAdsRefreshToken.trim() || undefined,
      }
      const res = editingId
        ? await fetch(`/api/clients/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Save failed (${res.status}): ${err.error ?? "unknown error"}`)
        return
      }
      await load()
      cancelForm()
    } finally {
      setSaving(false)
    }
  }

  async function toggleEnabled(client: MaskedClient) {
    await fetch(`/api/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !client.enabled }),
    })
    await load()
  }

  async function deleteClient(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" })
      await load()
    } finally {
      setDeletingId(null)
    }
  }

  async function testConnection(client: MaskedClient) {
    setTestingId(client.id)
    try {
      const res = await fetch(`/api/campaigns?clientId=${client.id}&force=1`)
      const data = await res.json()
      setTestResults((prev) => ({ ...prev, [client.id]: data.campaigns ? "ok" : "fail" }))
    } catch {
      setTestResults((prev) => ({ ...prev, [client.id]: "fail" }))
    } finally {
      setTestingId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Each client has their own ad accounts. Meta campaigns cover Facebook + Instagram.
        </p>
        <Button onClick={startAdd} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-5 space-y-4 bg-card">
          <h3 className="font-medium text-sm">{editingId ? "Edit Client" : "New Client"}</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Client name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="space-y-1">
              <Label>Portal email <span className="text-zinc-400 font-normal">(client login email)</span></Label>
              <Input
                type="email"
                value={form.userEmail}
                onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))}
                placeholder="client@example.com"
              />
            </div>

            {/* Meta / Instagram section */}
            <div className="pt-1 pb-0.5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Meta · Facebook + Instagram</p>
            </div>
            <div className="space-y-1">
              <Label>Ad Account ID</Label>
              <Input
                value={form.metaAdAccountId}
                onChange={(e) => setForm((f) => ({ ...f, metaAdAccountId: e.target.value }))}
                placeholder="act_123456789"
              />
            </div>
            <div className="space-y-1">
              <Label>{editingId ? "Access Token (leave blank to keep current)" : "Access Token"}</Label>
              <Input
                type="password"
                value={form.metaAccessToken}
                onChange={(e) => setForm((f) => ({ ...f, metaAccessToken: e.target.value }))}
                placeholder={editingId ? "Leave blank to keep existing" : "EAA..."}
              />
            </div>

            {/* TikTok section toggle */}
            <button
              type="button"
              onClick={() => setShowTikTok((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide pt-1 hover:text-zinc-700 transition-colors"
            >
              {showTikTok ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              TikTok Ads <span className="font-normal normal-case text-zinc-400">(optional)</span>
            </button>

            {showTikTok && (
              <div className="space-y-3 pl-3 border-l-2 border-border">
                <div className="space-y-1">
                  <Label>TikTok Advertiser ID</Label>
                  <Input
                    value={form.tiktokAdAccountId}
                    onChange={(e) => setForm((f) => ({ ...f, tiktokAdAccountId: e.target.value }))}
                    placeholder="7123456789012345678"
                  />
                </div>
                <div className="space-y-1">
                  <Label>{editingId ? "TikTok Access Token (leave blank to keep current)" : "TikTok Access Token"}</Label>
                  <Input
                    type="password"
                    value={form.tiktokAccessToken}
                    onChange={(e) => setForm((f) => ({ ...f, tiktokAccessToken: e.target.value }))}
                    placeholder={editingId ? "Leave blank to keep existing" : "..."}
                  />
                </div>
              </div>
            )}

            {/* Google Ads section toggle */}
            <button
              type="button"
              onClick={() => setShowGoogle((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide pt-1 hover:text-zinc-700 transition-colors"
            >
              {showGoogle ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Google Ads <span className="font-normal normal-case text-zinc-400">(optional — requires Developer Token)</span>
            </button>

            {showGoogle && (
              <div className="space-y-3 pl-3 border-l-2 border-border">
                <div className="space-y-1">
                  <Label>Customer ID</Label>
                  <Input
                    value={form.googleAdsCustomerId}
                    onChange={(e) => setForm((f) => ({ ...f, googleAdsCustomerId: e.target.value }))}
                    placeholder="123-456-7890"
                  />
                  <p className="text-xs text-zinc-400">Found in the top-right of Google Ads (without dashes)</p>
                </div>
                <div className="space-y-1">
                  <Label>{editingId ? "Refresh Token (leave blank to keep current)" : "Refresh Token"}</Label>
                  <Input
                    type="password"
                    value={form.googleAdsRefreshToken}
                    onChange={(e) => setForm((f) => ({ ...f, googleAdsRefreshToken: e.target.value }))}
                    placeholder={editingId ? "Leave blank to keep existing" : "Generated via OAuth Playground"}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={cancelForm}>Cancel</Button>
            <Button
              onClick={save}
              disabled={saving || !form.name || !form.metaAdAccountId || (!editingId && !form.metaAccessToken)}
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Saving...</> : "Save"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 border-2 border-dashed rounded-lg">
          <p className="font-medium text-foreground">No clients yet</p>
          <p className="text-sm mt-1">Add a client to manage their Meta and TikTok ad accounts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div key={client.id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{client.name}</p>
                  {testResults[client.id] === "ok" && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                    </span>
                  )}
                  {testResults[client.id] === "fail" && (
                    <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                      <XCircle className="h-3.5 w-3.5" /> Failed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                    Meta · FB + IG
                  </span>
                  {client.tiktokAdAccountId && (
                    <span className="inline-flex items-center gap-1 text-xs bg-black text-white px-1.5 py-0.5 rounded font-medium">
                      TikTok
                    </span>
                  )}
                  {client.googleAdsCustomerId && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded font-medium">
                      Google Ads
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">{client.metaAdAccountId}</span>
                </div>
                {client.userEmail && (
                  <p className="text-xs text-zinc-400 mt-0.5">{client.userEmail}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={client.enabled}
                  onCheckedChange={() => toggleEnabled(client)}
                  aria-label="Enabled"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => testConnection(client)}
                  disabled={testingId === client.id}
                >
                  {testingId === client.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Test"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-500"
                  title="Manage users"
                  onClick={() => {
                    if (expandedUsers === client.id) {
                      setExpandedUsers(null)
                    } else {
                      setExpandedUsers(client.id)
                      loadUsers(client.id)
                    }
                  }}
                >
                  <Users className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => startEdit(client)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={() => deleteClient(client.id)}
                  disabled={deletingId === client.id}
                >
                  {deletingId === client.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
              </div>

            {/* Users panel */}
            {expandedUsers === client.id && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Portal Users</p>
                {(clientUsers[client.id] ?? []).length === 0 ? (
                  <p className="text-xs text-zinc-400">No users linked yet. Add a user below to grant portal access.</p>
                ) : (
                  <div className="space-y-1">
                    {(clientUsers[client.id] ?? []).map((u) => (
                      <div key={u.id} className="flex items-center justify-between text-xs py-1">
                        <div>
                          <span className="font-medium text-zinc-700">{u.userEmail}</span>
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold ${u.role === "admin" ? "bg-indigo-600/10 text-indigo-400 dark:text-indigo-300" : "bg-muted text-muted-foreground"}`}>{u.role}</span>
                        </div>
                        <button onClick={() => removeUser(client.id, u.userEmail)} className="text-red-400 hover:text-red-600 ml-2">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 items-center pt-1">
                  <Input
                    value={addUserEmail}
                    onChange={(e) => setAddUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="h-7 text-xs flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addUser(client.id)}
                  />
                  <select
                    value={addUserRole}
                    onChange={(e) => setAddUserRole(e.target.value as "viewer" | "admin")}
                    className="h-7 text-xs border border-border rounded px-1.5 bg-background text-foreground"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button size="sm" className="h-7 text-xs px-2" onClick={() => addUser(client.id)} disabled={addingUser || !addUserEmail.trim()}>
                    {addingUser ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                  </Button>
                </div>
              </div>
            )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
