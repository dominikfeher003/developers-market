"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useActiveClient } from "@/lib/client-context"

interface Invoice {
  id: string
  clientId: string
  number: string
  description: string
  amount: number
  currency: string
  status: "paid" | "pending" | "overdue"
  issuedAt: string
  dueDate: string
}

type FormState = Omit<Invoice, "id" | "clientId">

const EMPTY_FORM: FormState = {
  number: "", description: "", amount: 0, currency: "USD",
  status: "pending", issuedAt: "", dueDate: "",
}

const STATUS_COLORS = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100)
}
function fmtDate(s: string) {
  return s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"
}

export function InvoicesManager() {
  const { activeClientId } = useActiveClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const url = activeClientId ? `/api/invoices?clientId=${activeClientId}` : "/api/invoices"
    const res = await fetch(url)
    const data = await res.json() as { invoices: Invoice[] }
    setInvoices(data.invoices ?? [])
    setLoading(false)
  }, [activeClientId])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ ...EMPTY_FORM, issuedAt: new Date().toISOString().slice(0, 10) })
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(inv: Invoice) {
    setForm({
      number: inv.number, description: inv.description, amount: inv.amount,
      currency: inv.currency, status: inv.status, issuedAt: inv.issuedAt, dueDate: inv.dueDate,
    })
    setEditingId(inv.id)
    setShowForm(true)
  }

  async function save() {
    if (!activeClientId) { alert("Select a client first"); return }
    if (!form.number.trim() || !form.issuedAt || !form.dueDate) {
      alert("Invoice number, issue date, and due date are required"); return
    }
    setSaving(true)
    try {
      if (editingId) {
        await fetch(`/api/invoices/${editingId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        })
      } else {
        await fetch("/api/invoices", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, clientId: activeClientId }),
        })
      }
      setShowForm(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this invoice?")) return
    setDeletingId(id)
    await fetch(`/api/invoices/${id}`, { method: "DELETE" })
    setDeletingId(null)
    await load()
  }

  const F = (k: keyof FormState) => ({
    value: String(form[k]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: k === "amount" ? Number(e.target.value) : e.target.value })),
  })

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {activeClientId ? `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}` : "Select a client to manage their invoices"}
        </p>
        <Button onClick={openCreate} className="gap-1.5" disabled={!activeClientId}>
          <Plus className="h-4 w-4" /> Add Invoice
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
      ) : !activeClientId ? (
        <div className="text-center py-20 text-zinc-400 border-2 border-dashed rounded-lg">
          <p className="font-medium text-foreground">No client selected</p>
          <p className="text-sm mt-1">Use the client switcher in the sidebar to select a client.</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 border-2 border-dashed rounded-lg">
          <p className="font-medium text-foreground">No invoices yet</p>
          <p className="text-sm mt-1">Create the first invoice for this client.</p>
          <Button className="mt-4 gap-1.5" onClick={openCreate}><Plus className="h-4 w-4" /> Add Invoice</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                <th className="py-3 px-4 text-left">Invoice</th>
                <th className="py-3 px-4 text-left">Description</th>
                <th className="py-3 px-4 text-left">Issued</th>
                <th className="py-3 px-4 text-left">Due</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={inv.id} className={`hover:bg-muted/30 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
                  <td className="py-3 px-4 font-mono text-sm font-medium">{inv.number}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px] truncate">{inv.description || "—"}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">{fmtDate(inv.issuedAt)}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">{fmtDate(inv.dueDate)}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-right tabular-nums">{fmt(inv.amount)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status]}`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(inv)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => del(inv.id)} disabled={deletingId === inv.id} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors">
                        {deletingId === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold">{editingId ? "Edit Invoice" : "New Invoice"}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Invoice Number *</label>
                  <input {...F("number")} placeholder="INV-2026-001" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                  <select {...F("status")} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors">
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                <input {...F("description")} placeholder="June retainer — Ad management" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Amount (cents) *</label>
                  <input {...F("amount")} type="number" placeholder="35000" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
                  <p className="text-[11px] text-muted-foreground mt-1">{fmt(Number(form.amount))} — enter in cents (e.g. 35000 = $350)</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Currency</label>
                  <select {...F("currency")} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors">
                    <option>USD</option><option>EUR</option><option>GBP</option><option>HUF</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Issue Date *</label>
                  <input {...F("issuedAt")} type="date" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Due Date *</label>
                  <input {...F("dueDate")} type="date" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? "Save Changes" : "Create Invoice"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
