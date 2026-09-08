import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Link } from "react-router"
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
  href,
}: {
  label: string
  value: ReactNode
  detail: string
  icon: LucideIcon
  href?: string
}) {
  const card = (
    <Card size="sm" className="gap-1 border-0 shadow-none ring-0">
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
  return href ? (
    <Link
      to={href}
      className="block min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card}
    </Link>
  ) : (
    card
  )
}
