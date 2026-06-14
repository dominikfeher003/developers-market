export type { MetricKey, Operator, RuleAction, CampaignStatus, DailyInsight, Campaign, Client, Rule, Alert } from "./shared"

export interface PotentialClient {
  id: string
  firstName: string
  lastName: string
  email: string
  title: string
  company: string
  website: string
  country: string
  language: string
  status: "pending" | "sent" | "skipped"
  scheduledFor: string | null
  sentAt: string | null
  notes: string
  addedAt: string
}

export interface InboxEntry {
  uid: number
  from: string
  fromName: string
  subject: string
  preview: string
  body: string
  receivedAt: string
  read: boolean
  leadCompany?: string
}

export interface Settings {
  metaAdAccountId: string
  metaAccessToken: string
  notificationEmail: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  imapHost: string
  imapPort: number
  slackWebhookUrl?: string
  lastAgentRun: string | null
  agentEnabled: boolean
}

export interface AgentRunResult {
  success: boolean
  actionsCount: number
  runId: string
  errors: string[]
}
