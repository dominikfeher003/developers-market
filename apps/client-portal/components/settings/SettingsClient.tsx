"use client"

import { useState } from "react"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { User, Bell, Palette, Monitor, Sun, Moon } from "lucide-react"
import { usePortalI18n } from "@/lib/i18n/context"

type Tab = "profile" | "notifications" | "appearance"

interface Props {
  clientName: string
  userEmail: string
  userName: string
}

export function SettingsClient({ clientName, userEmail, userName }: Props) {
  const [tab, setTab] = useState<Tab>("profile")
  const { theme, setTheme } = useTheme()
  const { t } = usePortalI18n()

  const [notifSettings, setNotifSettings] = useState({
    ruleAlerts: true,
    weeklyReport: true,
    invoices: false,
    budgetWarnings: true,
  })

  const tabs = [
    { id: "profile" as Tab, label: t.settings.tabs.profile, icon: User },
    { id: "notifications" as Tab, label: t.settings.tabs.notifications, icon: Bell },
    { id: "appearance" as Tab, label: t.settings.tabs.appearance, icon: Palette },
  ]

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
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
              { label: t.settings.profile.fullName, value: userName },
              { label: t.settings.profile.email, value: userEmail },
              { label: t.settings.profile.company, value: clientName },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
                <div className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground">
                  {value || "—"}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">{t.settings.profile.managed}</p>
          </div>
        )}

        {tab === "notifications" && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">{t.settings.notifSettings.intro}</p>
            {[
              { key: "ruleAlerts" as const, label: t.settings.notifSettings.ruleAlerts, description: t.settings.notifSettings.ruleAlertsDesc },
              { key: "weeklyReport" as const, label: t.settings.notifSettings.weeklyReport, description: t.settings.notifSettings.weeklyReportDesc },
              { key: "invoices" as const, label: t.settings.notifSettings.invoices, description: t.settings.notifSettings.invoicesDesc },
              { key: "budgetWarnings" as const, label: t.settings.notifSettings.budgetWarnings, description: t.settings.notifSettings.budgetWarningsDesc },
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
            <p className="text-sm text-muted-foreground">{t.settings.appearance.intro}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light" as const, label: t.settings.appearance.light, icon: Sun },
                { value: "dark" as const, label: t.settings.appearance.dark, icon: Moon },
                { value: "system" as const, label: t.settings.appearance.system, icon: Monitor },
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
