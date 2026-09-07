import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

type UnderlineHoverProps = React.ComponentProps<"span"> & {
  asChild?: boolean
}

const UNDERLINE_HOVER_CSS = `
  .underline-hover {
    position: relative;
    display: inline-block;
    width: fit-content;
    max-width: 100%;
  }

  .underline-hover::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 2px;
    pointer-events: none;
    content: "";
    background: linear-gradient(to right, var(--border), var(--primary)) no-repeat;
    background-position: right bottom;
    background-size: 0 2px;
    transition: background-size 0.5s;
  }

  .underline-hover:hover::after,
  .underline-hover:focus-visible::after {
    background-position: left bottom;
    background-size: 100% 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    .underline-hover::after {
      transition: none;
    }
  }
`

function UnderlineHover({
  asChild = false,
  className,
  ...props
}: UnderlineHoverProps) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <>
      <style href="underline-hover" precedence="default">
        {UNDERLINE_HOVER_CSS}
      </style>
      <Comp
        data-slot="underline-hover"
        className={cn("underline-hover", className)}
        {...props}
      />
    </>
  )
}

export { UnderlineHover }
