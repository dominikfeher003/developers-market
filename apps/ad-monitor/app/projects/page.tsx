import { TopBar } from "@/components/layout/TopBar"
import { ProjectsManager } from "@/components/projects/ProjectsManager"

export default function ProjectsPage() {
  return (
    <div>
      <TopBar title="Projects" />
      <ProjectsManager />
    </div>
  )
}
