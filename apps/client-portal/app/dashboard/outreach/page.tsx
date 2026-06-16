import { OutreachChat } from "@/components/outreach/OutreachChat"
import { getPortalT } from "@/lib/i18n/server"

export default async function OutreachPage() {
  const t = await getPortalT()

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-3.5rem)]">
      <div className="max-w-3xl mx-auto h-full flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t.outreach.heading}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.outreach.subtitle}</p>
        </div>
        <div className="flex-1 min-h-0">
          <OutreachChat />
        </div>
      </div>
    </div>
  )
}
