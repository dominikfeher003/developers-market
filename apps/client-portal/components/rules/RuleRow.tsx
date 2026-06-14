import { Rule } from "@/lib/types"
import { cn } from "@/lib/utils"

const METRIC_LABELS: Record<string, string> = {
  purchase_roas: "ROAS", spend: "Spend", impressions: "Impressions", clicks: "Clicks",
  ctr: "CTR", reach: "Reach", frequency: "Frequency", video_views: "Video Views",
  video_view_rate: "Video View Rate", engagement_rate: "Engagement Rate",
  cost_per_engagement: "Cost/Engagement", post_likes: "Likes", post_comments: "Comments", post_shares: "Shares",
}

const OP_LABELS: Record<string, string> = {
  less_than: "drops below", greater_than: "exceeds", equals: "equals",
}

const ACTION_LABELS: Record<string, string> = {
  pause: "Pause campaign", resume: "Resume campaign",
  scale_budget: "Scale budget", notify_only: "Send notification",
}

interface Props { rule: Rule }

export function RuleRow({ rule }: Props) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              rule.enabled ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
            )}>
              {rule.enabled ? "Active" : "Disabled"}
            </span>
            <h3 className="text-sm font-semibold text-zinc-800 truncate">{rule.name}</h3>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed">
            If <span className="font-medium text-zinc-700">{METRIC_LABELS[rule.metric] ?? rule.metric}</span>
            {" "}{OP_LABELS[rule.operator] ?? rule.operator}{" "}
            <span className="font-medium text-zinc-700">{rule.threshold}</span>
            {" "}over <span className="font-medium text-zinc-700">{rule.windowDays}</span> day{rule.windowDays !== 1 ? "s" : ""}
            {" "}→ <span className="font-medium text-indigo-600">{ACTION_LABELS[rule.action] ?? rule.action}</span>
            {rule.action === "scale_budget" && rule.actionValue != null && (
              <span className="text-zinc-500"> ({rule.actionValue > 0 ? "+" : ""}{rule.actionValue}%)</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
