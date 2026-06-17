import { TopBar } from "@/components/layout/TopBar"
import { SupportManager } from "@/components/support/SupportManager"

export default function SupportPage() {
  return (
    <div>
      <TopBar title="Support Tickets" />
      <SupportManager />
    </div>
  )
}
