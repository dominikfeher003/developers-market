import {
  pgTable, serial, text, boolean, integer, real, timestamp, date, jsonb, unique,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  metaAdAccountId: text("meta_ad_account_id").notNull().default(""),
  metaAccessToken: text("meta_access_token").notNull().default(""),
  notificationEmail: text("notification_email").notNull().default(""),
  smtpHost: text("smtp_host").notNull().default("smtp.gmail.com"),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpUser: text("smtp_user").notNull().default(""),
  smtpPass: text("smtp_pass").notNull().default(""),
  imapHost: text("imap_host").notNull().default("mail.privateemail.com"),
  imapPort: integer("imap_port").notNull().default(993),
  slackWebhookUrl: text("slack_webhook_url"),
  lastAgentRun: timestamp("last_agent_run", { withTimezone: true }),
  agentEnabled: boolean("agent_enabled").notNull().default(true),
})

export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  metaAdAccountId: text("meta_ad_account_id").notNull().default(""),
  metaAccessToken: text("meta_access_token").notNull().default(""),
  tiktokAdAccountId: text("tiktok_ad_account_id"),
  tiktokAccessToken: text("tiktok_access_token"),
  googleAdsCustomerId: text("google_ads_customer_id"),
  googleAdsRefreshToken: text("google_ads_refresh_token"),
  userEmail: text("user_email"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const clientUsers = pgTable("client_users", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  userEmail: text("user_email").notNull(),
  role: text("role", { enum: ["admin", "viewer"] }).notNull().default("viewer"),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.clientId, t.userEmail)])

export const rules = pgTable("rules", {
  id: text("id").primaryKey(),
  clientId: text("client_id"),
  name: text("name").notNull(),
  metric: text("metric").notNull(),
  operator: text("operator").notNull(),
  threshold: real("threshold").notNull(),
  windowDays: integer("window_days").notNull().default(7),
  appliesTo: text("applies_to").notNull().default("all"),
  campaignIds: text("campaign_ids").array().notNull().default(sql`'{}'::text[]`),
  action: text("action").notNull(),
  actionValue: real("action_value"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  ruleId: text("rule_id").notNull(),
  ruleName: text("rule_name").notNull(),
  campaignId: text("campaign_id").notNull(),
  campaignName: text("campaign_name").notNull(),
  action: text("action").notNull(),
  actionValue: real("action_value"),
  metricValue: real("metric_value").notNull(),
  metricName: text("metric_name").notNull(),
  status: text("status").notNull().default("success"),
  errorMessage: text("error_message"),
  agentRunId: text("agent_run_id").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
})

export const campaignSnapshots = pgTable("campaign_snapshots", {
  id: serial("id").primaryKey(),
  campaignId: text("campaign_id").notNull(),
  clientId: text("client_id").notNull(),
  platform: text("platform").notNull().default("meta"),
  date: date("date").notNull(),
  spend: real("spend").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  roas: real("roas").notNull().default(0),
  dailyBudget: real("daily_budget").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.campaignId, t.date)])

export const potentialClients = pgTable("potential_clients", {
  id: text("id").primaryKey(),
  clientId: text("client_id"),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  email: text("email").notNull(),
  title: text("title").notNull().default(""),
  company: text("company").notNull().default(""),
  website: text("website").notNull().default(""),
  country: text("country").notNull().default(""),
  language: text("language").notNull().default(""),
  status: text("status", { enum: ["pending", "sent", "skipped"] }).notNull().default("pending"),
  scheduledFor: text("scheduled_for"),
  sentAt: text("sent_at"),
  notes: text("notes").notNull().default(""),
  addedAt: text("added_at").notNull(),
})

export const outreachHistory = pgTable("outreach_history", {
  id: text("id").primaryKey(),
  clientId: text("client_id"),
  sentAt: text("sent_at").notNull(),
  toEmail: text("to_email").notNull(),
  toName: text("to_name").notNull().default(""),
  company: text("company").notNull().default(""),
  subject: text("subject").notNull(),
  status: text("status", { enum: ["sent", "failed"] }).notNull(),
  error: text("error"),
})

export const reportLogs = pgTable("report_logs", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  reportType: text("report_type").notNull().default("weekly"),
})

export const kvCache = pgTable("kv_cache", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  description: text("description").notNull().default(""),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status", { enum: ["paid", "pending", "overdue"] }).notNull().default("pending"),
  issuedAt: date("issued_at").notNull(),
  dueDate: date("due_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  status: text("status", { enum: ["active", "review", "completed", "on-hold"] }).notNull().default("active"),
  progress: integer("progress").notNull().default(0),
  deadline: date("deadline"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const supportTickets = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull().default("General"),
  status: text("status", { enum: ["open", "in-progress", "resolved", "closed"] }).notNull().default("open"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull().default("medium"),
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
