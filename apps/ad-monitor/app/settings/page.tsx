import { SettingsForm } from "@/components/settings/SettingsForm"

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Configure your Meta API credentials, notifications, and agent settings.</p>
      </div>
      <SettingsForm />
    </div>
  )
}
