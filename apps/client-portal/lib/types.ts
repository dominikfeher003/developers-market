export type { MetricKey, Operator, RuleAction, CampaignStatus, DailyInsight, Campaign, Client, Rule, Alert } from "./shared"

export interface AccountInfo {
  balance: number
  currency: string
  spend_cap: number
  amount_spent: number
}
