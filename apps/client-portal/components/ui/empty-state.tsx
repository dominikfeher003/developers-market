import { cn } from "@/lib/utils"

interface Props {
  icon: React.ElementType
  title: string
  description?: string
  className?: string
}

export function EmptyState({ icon: Icon, title, description, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>}
    </div>
  )
}
