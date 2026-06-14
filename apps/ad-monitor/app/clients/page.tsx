import { ClientsManager } from "@/components/clients/ClientsManager"
import { TopBar } from "@/components/layout/TopBar"

export default function ClientsPage() {
  return (
    <div>
      <TopBar title="Clients" />
      <ClientsManager />
    </div>
  )
}
