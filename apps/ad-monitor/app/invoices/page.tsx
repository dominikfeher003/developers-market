import { TopBar } from "@/components/layout/TopBar"
import { InvoicesManager } from "@/components/invoices/InvoicesManager"

export default function InvoicesPage() {
  return (
    <div>
      <TopBar title="Invoices" />
      <InvoicesManager />
    </div>
  )
}
