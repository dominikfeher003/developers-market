"use client"

import { useState } from "react"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { User, Bell, Palette, Monitor, Sun, Moon } from "lucide-react"

type Tab = "profile" | "notifications" | "appearance"

interface Props {
  clientName: string
  userEmail: string
  userName: string
}

export function SettingsClient({ clientName, userEmail, userName }: Props) {
  const [tab, setTab] = useState<Tab>("profile")
  const { theme, setTheme } = useTheme()

  const [notifSettings, setNotifSettings] = useState({
    ruleAlerts: true,
    weeklyReport: true,
    invoices: false,
    budgetWarnings: true,
  })

  const tabs = [
    { id: "profile" as Tab, label: "Profile", icon: User },
    { id: "notifications" as Tab, label: "Notifications", icon: Bell },
    { id: "appearance" as Tab, label: "Appearance", icon: Palette },
  ]

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="border-b border-border flex">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors",
              tab === id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === "profile" && (
          <div className="space-y-5">
            {[
              { label: "Full Name", value: userName },
              { label: "Email Address", value: userEmail },
              { label: "Company", value: clientName },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
                <div className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground">
                  {value || "—"}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Profile information is managed by your account admin. Contact your account manager to make changes.</p>
          </div>
        )}

        {tab === "notifications" && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">Choose which notifications you&apos;d like to receive by email.</p>
            {[
              { key: "ruleAlerts" as const, label: "Rule alerts", description: "Get notified when an automation rule triggers" },
              { key: "weeklyReport" as const, label: "Weekly performance report", description: "Summary of your campaigns every Monday" },
              { key: "invoices" as const, label: "Invoice notifications", description: "Emails when new invoices are issued or due" },
              { key: "budgetWarnings" as const, label: "Budget warnings", description: "Alerts when campaigns approach their daily budget" },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <button
                  onClick={() => setNotifSettings((s) => ({ ...s, [key]: !s[key] }))}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
                    notifSettings[key] ? "bg-indigo-600" : "bg-muted border border-border"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    notifSettings[key] ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "appearance" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose your preferred color theme.</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light" as const, label: "Light", icon: Sun },
                { value: "dark" as const, label: "Dark", icon: Moon },
                { value: "system" as const, label: "System", icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all",
                    theme === value
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-border hover:border-ring/40 bg-card"
                  )}
                >
                  <Icon className={cn("h-5 w-5", theme === value ? "text-indigo-600" : "text-muted-foreground")} />
                  <span className={cn("text-xs font-medium", theme === value ? "text-indigo-600" : "text-muted-foreground")}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
