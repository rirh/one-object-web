import type { Table as TanStackTable } from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { PAGE_SIZE_OPTIONS } from "@/lib/pagination"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { PageButton } from "@/views/dashboard/admin/components/shared/resource-table/parts"

export function ResourceTableFooter<TData>({
  compact,
  firstRow,
  isBulkDeleting,
  isFetching,
  lastRow,
  onBulkDelete,
  pageCount,
  pageIndex,
  pageSize,
  selectedRecords,
  showPaginationFooter,
  table,
  totalRows,
  zh,
}: {
  compact: boolean
  firstRow: number
  isBulkDeleting: boolean
  isFetching: boolean
  lastRow: number
  onBulkDelete?: (rows: TData[], clearSelection: () => void) => void
  pageCount: number
  pageIndex: number
  pageSize: number
  selectedRecords: TData[]
  showPaginationFooter: boolean
  table: TanStackTable<TData>
  totalRows: number
  zh: boolean
}) {
  return (
    <>
      {showPaginationFooter ? (
        <div
          className={cn(
            "flex shrink-0 flex-col gap-2 border-t bg-muted px-3 sm:flex-row sm:items-center sm:justify-between lg:px-4",
            compact ? "py-1.5" : "py-2",
          )}
        >
          <span className="text-sm text-muted-foreground">
            {zh
              ? `第 ${firstRow}-${lastRow} 项，共 ${totalRows} 项`
              : `${firstRow}-${lastRow} of ${totalRows}`}
            {isFetching ? (zh ? " · 更新中" : " · Updating") : ""}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PAGE_SIZE_OPTIONS.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {zh ? `${value} 条` : `${value} rows`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <PageButton
              label={zh ? "第一页" : "First page"}
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
            >
              <ChevronsLeftIcon />
            </PageButton>
            <PageButton
              label={zh ? "上一页" : "Previous page"}
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeftIcon />
            </PageButton>
            <span className="min-w-20 text-center text-sm text-muted-foreground">
              {pageIndex + 1} / {pageCount}
            </span>
            <PageButton
              label={zh ? "下一页" : "Next page"}
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRightIcon />
            </PageButton>
            <PageButton
              label={zh ? "最后一页" : "Last page"}
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(pageCount - 1)}
            >
              <ChevronsRightIcon />
            </PageButton>
          </div>
        </div>
      ) : null}

      {selectedRecords.length > 0 ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4",
            showPaginationFooter ? "bottom-16" : "bottom-4",
          )}
        >
          <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-2 rounded-xl bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10">
            <span className="text-muted-foreground">
              {zh ? "已选择 " : "Selected "}
              <span className="font-medium tabular-nums">
                {selectedRecords.length}
              </span>
              {zh ? " 项" : " items"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBulkDeleting}
              onClick={() => table.resetRowSelection()}
            >
              <XIcon data-icon="inline-start" />
              {zh ? "取消选择" : "Clear"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isBulkDeleting}
              onClick={() =>
                onBulkDelete?.(selectedRecords, () => table.resetRowSelection())
              }
            >
              <Trash2Icon data-icon="inline-start" />
              {zh ? "批量删除" : "Delete"}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
