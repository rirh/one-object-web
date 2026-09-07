import type { ReactNode } from "react"

import { SweepShine } from "@/components/sweep-shine"

export function LoadingState({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex min-h-48 flex-1 items-center justify-center px-6 py-8 text-sm text-muted-foreground"
    >
      <SweepShine>{children}</SweepShine>
    </div>
  )
}
