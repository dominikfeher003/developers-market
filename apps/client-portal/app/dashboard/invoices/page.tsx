import { StatusBadge } from "@/components/ui/status-badge"
import { Download } from "lucide-react"
import { getPortalT } from "@/lib/i18n/server"
import { tr } from "@/lib/i18n/en"

type Invoice = {
  id: string
  number: string
  date: string
  dueDate: string
  amount: number
  status: "paid" | "pending" | "overdue"
  description: string
}

const INVOICES: Invoice[] = [
  { id: "i1", number: "INV-2025-006", date: "2025-06-01", dueDate: "2025-06-15", amount: 350000, status: "pending", description: "June retainer — Ad management & strategy" },
  { id: "i2", number: "INV-2025-005", date: "2025-05-01", dueDate: "2025-05-15", amount: 350000, status: "paid", description: "May retainer — Ad management & strategy" },
  { id: "i3", number: "INV-2025-004", date: "2025-04-01", dueDate: "2025-04-15", amount: 350000, status: "paid", description: "April retainer — Ad management & strategy" },
  { id: "i4", number: "INV-2025-003", date: "2025-03-01", dueDate: "2025-03-15", amount: 350000, status: "paid", description: "March retainer — Ad management & strategy" },
  { id: "i5", number: "INV-2025-002", date: "2025-02-01", dueDate: "2025-02-15", amount: 275000, status: "paid", description: "February retainer — Ad management & strategy" },
  { id: "i6", number: "INV-2025-001", date: "2025-01-01", dueDate: "2025-01-15", amount: 275000, status: "paid", description: "January retainer + setup fee" },
  { id: "i7", number: "INV-2024-Q4", date: "2024-12-01", dueDate: "2024-12-15", amount: 150000, status: "paid", description: "Q4 Holiday campaign management" },
  { id: "i8", number: "INV-2024-SETUP", date: "2024-11-01", dueDate: "2024-11-15", amount: 50000, status: "overdue", description: "One-time account setup & onboarding" },
]

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default async function InvoicesPage() {
  const t = await getPortalT()

  const STATUS_MAP = {
    paid: { label: t.invoices.status.paid, variant: "success" as const },
    pending: { label: t.invoices.status.pending, variant: "warning" as const },
    overdue: { label: t.invoices.status.overdue, variant: "danger" as const },
  }

  const paid = INVOICES.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const pending = INVOICES.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0)
  const overdue = INVOICES.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t.invoices.heading}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{tr(t.invoices.totalCount, { n: INVOICES.length })}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t.invoices.totalPaid, value: fmt(paid), color: "text-emerald-600 dark:text-emerald-400" },
          { label: t.invoices.pending, value: fmt(pending), color: "text-amber-600 dark:text-amber-400" },
          { label: t.invoices.overdue, value: fmt(overdue), color: overdue > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  t.invoices.headers.invoice,
                  t.invoices.headers.date,
                  t.invoices.headers.dueDate,
                  t.invoices.headers.description,
                  t.invoices.headers.amount,
                  t.invoices.headers.status,
                  "",
                ].map((h) => (
                  <th key={h} className={`py-3 px-4 text-xs font-medium text-muted-foreground ${h === t.invoices.headers.amount ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv, idx) => {
                const s = STATUS_MAP[inv.status]
                return (
                  <tr key={inv.id} className={`hover:bg-muted/30 transition-colors ${idx > 0 ? "border-t border-border" : ""}`}>
                    <td className="py-3.5 px-4">
                      <span className="text-sm font-mono font-medium text-foreground">{inv.number}</span>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-muted-foreground whitespace-nowrap">{fmtDate(inv.date)}</td>
                    <td className="py-3.5 px-4 text-sm text-muted-foreground whitespace-nowrap">{fmtDate(inv.dueDate)}</td>
                    <td className="py-3.5 px-4 text-sm text-muted-foreground max-w-[240px] truncate">{inv.description}</td>
                    <td className="py-3.5 px-4 text-sm font-semibold text-foreground text-right tabular-nums whitespace-nowrap">{fmt(inv.amount)}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge variant={s.variant} dot>{s.label}</StatusBadge>
                    </td>
                    <td className="py-3.5 px-4">
                      <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
