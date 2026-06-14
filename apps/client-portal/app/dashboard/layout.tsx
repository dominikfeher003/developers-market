import { getUserClient } from "@/lib/get-user-client"
import { AppShell } from "@/components/layout/AppShell"
import { AutoRefresh } from "@/components/AutoRefresh"
import { Clock } from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const client = await getUserClient()

  if (!client) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-4">
            <Clock className="h-7 w-7 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Your account is being set up</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Your portal access is being configured by your account manager. You&apos;ll receive an email once everything is ready.
          </p>
          <p className="text-xs text-zinc-400 mt-4">
            Signed in as a different account?{" "}
            <a href="/sign-in" className="text-indigo-600 hover:underline">Switch account</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AutoRefresh intervalMs={10000} />
      <AppShell client={client}>{children}</AppShell>
    </>
  )
}
