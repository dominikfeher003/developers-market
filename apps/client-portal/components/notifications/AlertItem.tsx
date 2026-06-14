import { Alert } from "@/lib/types"
import { timeAgo, cn } from "@/lib/utils"

const ACTION_CONFIG = {
  pause: { label: "Paused", color: "bg-red-100 text-red-700" },
  resume: { label: "Resumed", color: "bg-green-100 text-green-700" },
  scale_budget: { label: "Budget scaled", color: "bg-blue-100 text-blue-700" },
  notify_only: { label: "Notified", color: "bg-zinc-100 text-zinc-600" },
}

interface Props { alert: Alert; compact?: boolean }

export function AlertItem({ alert, compact }: Props) {
  const cfg = ACTION_CONFIG[alert.action] ?? ACTION_CONFIG.notify_only
  return (
    <div className={cn("flex items-start gap-3", compact ? "py-2" : "py-3 border-b border-zinc-100 last:border-0")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
          {alert.action === "scale_budget" && alert.actionValue != null && (
            <span className="text-xs text-zinc-400">({alert.actionValue > 0 ? "+" : ""}{alert.actionValue}%)</span>
          )}
          <span className="text-xs text-zinc-400">{timeAgo(alert.timestamp)}</span>
        </div>
        <p className="text-sm text-zinc-700 mt-0.5 truncate">{alert.campaignName}</p>
        {!compact && (
          <p className="text-xs text-zinc-400 mt-0.5">
            {alert.ruleName} · {alert.metricName}: {alert.metricValue.toFixed(2)}
          </p>
        )}
      </div>
      <span className={cn(
        "text-xs px-1.5 py-0.5 rounded shrink-0",
        alert.status === "success" ? "bg-green-50 text-green-600" :
        alert.status === "error" ? "bg-red-50 text-red-500" : "bg-zinc-50 text-zinc-400"
      )}>
        {alert.status}
      </span>
    </div>
  )
}
