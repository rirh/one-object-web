import type { ReactNode } from "react"

type PageHeaderProps = {
  description: ReactNode
  eyebrow: ReactNode
  title: ReactNode
}

export function PageHeader({ description, eyebrow, title }: PageHeaderProps) {
  return (
    <header className="flex max-w-3xl flex-col items-start gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
      <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </header>
  )
}
