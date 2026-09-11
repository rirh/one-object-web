import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
export function TablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  hasNext,
  zh = true,
}: {
  total?: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  disabled?: boolean
  hasNext?: boolean
  zh?: boolean
}) {
  if (
    total !== undefined ? (!Number.isFinite(total) || total < PAGE_SIZE_OPTIONS[0]) : page === 1 && !hasNext
  )
    return null
  const pages =
    total === undefined ? undefined : Math.max(1, Math.ceil(total / pageSize))
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t bg-muted/40 px-3 py-2 text-sm lg:px-4">
      <span className="text-muted-foreground">
        {total === undefined
          ? zh
            ? `第 ${page} 页`
            : `Page ${page}`
          : zh
            ? `共 ${total} 条记录`
            : `${total} records`}
      </span>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            aria-label={zh ? "每页条数" : "Rows per page"}
            className="h-8 rounded-md border bg-background px-2"
            value={pageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
                {zh ? " 条/页" : " / page"}
              </option>
            ))}
          </select>
        )}
        <Button
          variant="outline"
          size="icon"
          aria-label={zh ? "上一页" : "Previous page"}
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-16 text-center tabular-nums text-muted-foreground">
          {page}
          {pages === undefined ? "" : ` / ${pages}`}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label={zh ? "下一页" : "Next page"}
          disabled={disabled || !(hasNext ?? page < (pages ?? 1))}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </footer>
  )
}
