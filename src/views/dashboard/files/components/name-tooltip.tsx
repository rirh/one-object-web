import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function NameTooltip({
  name,
  label = name,
  className = "",
  focusable = true,
}: {
  name: string
  label?: string
  className?: string
  focusable?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={focusable ? 0 : undefined}
          className={`block min-w-0 truncate ${className}`}
        >
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[min(32rem,calc(100vw-2rem))] break-all">
        {name}
      </TooltipContent>
    </Tooltip>
  )
}
