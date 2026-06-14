import { getUserClient } from "@/lib/get-user-client"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { SettingsClient } from "@/components/settings/SettingsClient"

export default async function SettingsPage() {
  const [client, user] = await Promise.all([getUserClient(), currentUser()])
  if (!client) redirect("/dashboard")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account preferences</p>
      </div>
      <SettingsClient
        clientName={client.name}
        userEmail={user?.emailAddresses[0]?.emailAddress ?? ""}
        userName={user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : client.name}
      />
    </div>
  )
}
