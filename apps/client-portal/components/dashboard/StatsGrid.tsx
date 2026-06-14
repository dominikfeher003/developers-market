import { Campaign, AccountInfo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, DollarSign, Activity, Wallet } from "lucide-react"

interface Props {
  campaigns: Campaign[]
  accountInfo: AccountInfo
}

export function StatsGrid({ campaigns, accountInfo }: Props) {
  const active = campaigns.filter((c) => c.status === "ACTIVE").length
  const totalSpend = campaigns.reduce((s, c) => s + c.insights.last7d.spend, 0)
  const avgRoas = campaigns.length > 0
    ? campaigns.reduce((s, c) => s + c.insights.last7d.purchase_roas, 0) / campaigns.length
    : 0

  const balance = accountInfo.balance > 0
    ? formatCurrency(accountInfo.balance, accountInfo.currency)
    : accountInfo.spend_cap > 0
      ? formatCurrency(accountInfo.spend_cap - accountInfo.amount_spent, accountInfo.currency) + " remaining"
      : "—"

  const stats = [
    {
      label: "Total Spend (7d)",
      value: `$${totalSpend.toFixed(0)}`,
      icon: DollarSign,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Avg ROAS (7d)",
      value: `${avgRoas.toFixed(2)}x`,
      icon: TrendingUp,
      color: avgRoas >= 3 ? "bg-green-50 text-green-600" : avgRoas >= 1.5 ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600",
    },
    {
      label: "Active Campaigns",
      value: String(active),
      icon: Activity,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Account Balance",
      value: balance,
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-600",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-500">{label}</p>
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{value}</p>
        </div>
      ))}
    </div>
  )
}
