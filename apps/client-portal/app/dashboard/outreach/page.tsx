import { OutreachChat } from "@/components/outreach/OutreachChat"

export default function OutreachPage() {
  return (
    <div className="p-4 md:p-6 h-[calc(100vh-3.5rem)]">
      <div className="max-w-3xl mx-auto h-full flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Outreach</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Find businesses with AI, write personalised cold emails, and send them in one flow.
          </p>
        </div>
        <div className="flex-1 min-h-0">
          <OutreachChat />
        </div>
      </div>
    </div>
  )
}
