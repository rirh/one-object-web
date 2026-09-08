import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: ReactNode
  detail: string
  icon: LucideIcon
}) {
  return (
    <Card size="sm" className="gap-1">
      <CardHeader className="flex items-center gap-2">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <CardDescription className="flex-1 font-medium">
          {label}
        </CardDescription>
        <div className="font-heading text-xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
      </CardHeader>
      <CardContent>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}
