import type { ComponentProps } from "react"
import { Slot } from "radix-ui"
import { UnderlineHover } from "@/components/underline-hover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Shared text-link treatment for native anchors and router Links.
export function TextLink({
  asChild = false,
  tooltip,
  className,
  ...props
}: ComponentProps<"a"> & { asChild?: boolean; tooltip: string }) {
  const Comp = asChild ? Slot.Root : "a"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <UnderlineHover asChild>
          <Comp className={cn("min-w-0 text-primary", className)} {...props} />
        </UnderlineHover>
      </TooltipTrigger>
      <TooltipContent className="max-w-[min(32rem,calc(100vw-2rem))] break-all">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
