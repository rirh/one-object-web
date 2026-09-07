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
    <Card size="sm">
      <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-3">
        <CardDescription className="font-medium">{label}</CardDescription>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="grid gap-1">
        <div className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}
