import { getUserClient } from "@/lib/get-user-client"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { SettingsClient } from "@/components/settings/SettingsClient"
import { getPortalT } from "@/lib/i18n/server"

export default async function SettingsPage() {
  const [client, user, t] = await Promise.all([getUserClient(), currentUser(), getPortalT()])
  if (!client) redirect("/dashboard")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t.settings.heading}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t.settings.subtitle}</p>
      </div>
      <SettingsClient
        clientName={client.name}
        userEmail={user?.emailAddresses[0]?.emailAddress ?? ""}
        userName={user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : client.name}
      />
    </div>
  )
}
