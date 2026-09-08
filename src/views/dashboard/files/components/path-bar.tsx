import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronRightIcon, DatabaseIcon } from "lucide-react"
import { useObjectTranslation } from "@/local/object"
import { CopyButton } from "@/components/ui/copy-button"
import { Button } from "@/components/ui/button"

export function PathBar({
  bucket,
  prefix,
  onNavigate,
}: {
  bucket: string
  prefix: string
  onNavigate: (path: string) => void
}) {
  const tx = useObjectTranslation()
  const segments = prefix.split("/")
  if (segments.at(-1) === "") segments.pop()
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <nav
        aria-label={tx("目录路径")}
        className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm"
      >
        <Button
          variant="ghost"
          className="shrink-0 gap-1.5 px-1 text-muted-foreground md:h-8"
          onClick={() => onNavigate("")}
          aria-label={tx("根目录")}
        >
          <DatabaseIcon />
          {bucket}
        </Button>
        {segments.map((segment, index) => {
          const path =
            segments.slice(0, index + 1).join("/") +
            (index < segments.length - 1 || prefix.endsWith("/") ? "/" : "")
          return (
            <span className="flex shrink-0 items-center gap-1" key={index}>
              <ChevronRightIcon
                aria-hidden="true"
                className="size-3.5 text-muted-foreground"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="max-w-48 truncate px-2 md:h-8"
                    aria-current={
                      index === segments.length - 1 ? "location" : undefined
                    }
                    onClick={() => onNavigate(path)}
                  >
                    <span className="truncate">{segment || "/"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[min(32rem,calc(100vw-2rem))] break-all">
                  {path}
                </TooltipContent>
              </Tooltip>
            </span>
          )
        })}
      </nav>
      <CopyButton
        variant="ghost"
        size="icon-sm"
        value={`${bucket}/${prefix}`}
        aria-label={tx("复制路径")}
        title={tx("复制路径")}
      />
    </div>
  )
}
