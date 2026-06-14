"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Client } from "@/lib/types"

type MaskedClient = Omit<Client, "metaAccessToken"> & { metaAccessToken: string }

interface FormState {
  name: string
  metaAdAccountId: string
  metaAccessToken: string
  userEmail: string
}

const EMPTY_FORM: FormState = { name: "", metaAdAccountId: "", metaAccessToken: "", userEmail: "" }

export function ClientsManager() {
  const [clients, setClients] = useState<MaskedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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

  function startAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function startEdit(client: MaskedClient) {
    setEditingId(client.id)
    setForm({ name: client.name, metaAdAccountId: client.metaAdAccountId, metaAccessToken: "", userEmail: client.userEmail ?? "" })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function save() {
    setSaving(true)
    try {
      const res = editingId
        ? await fetch(`/api/clients/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
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
          Each client has its own Meta ad account. Switch between clients using the sidebar dropdown.
        </p>
        <Button onClick={startAdd} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-5 space-y-4 bg-white">
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
            <div className="space-y-1">
              <Label>Meta Ad Account ID</Label>
              <Input
                value={form.metaAdAccountId}
                onChange={(e) => setForm((f) => ({ ...f, metaAdAccountId: e.target.value }))}
                placeholder="act_123456789"
              />
            </div>
            <div className="space-y-1">
              <Label>{editingId ? "New Access Token (leave blank to keep current)" : "Access Token"}</Label>
              <Input
                type="password"
                value={form.metaAccessToken}
                onChange={(e) => setForm((f) => ({ ...f, metaAccessToken: e.target.value }))}
                placeholder={editingId ? "Leave blank to keep existing token" : "EAA..."}
              />
            </div>
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
          <p className="font-medium text-zinc-600">No clients yet</p>
          <p className="text-sm mt-1">Add a client to manage multiple Meta ad accounts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div key={client.id} className="border rounded-lg p-4 bg-white flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
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
                <p className="text-xs text-zinc-400 mt-0.5">{client.metaAdAccountId}</p>
                {client.userEmail && (
                  <p className="text-xs text-zinc-400">{client.userEmail}</p>
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
          ))}
        </div>
      )}
    </div>
  )
}
