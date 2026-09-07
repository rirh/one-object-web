import { useMemo } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DownloadIcon, Trash2Icon } from "lucide-react"
import { bytes, date } from "@/lib/format"
import type { ObjectFile } from "../api"
export function FileTable({
  data,
  onDelete,
  pending,
}: {
  data: ObjectFile[]
  onDelete?: (file: ObjectFile) => void
  pending: boolean
}) {
  const columns = useMemo<ColumnDef<ObjectFile>[]>(
    () => [
      {
        accessorKey: "original_filename",
        header: "文件名",
        cell: ({ row }) => (
          <span
            className="block max-w-80 truncate"
            title={row.original.original_filename}
          >
            {row.original.original_filename}
          </span>
        ),
      },
      {
        accessorKey: "file_size",
        header: "大小",
        cell: ({ row }) => bytes(row.original.file_size),
      },
      {
        accessorKey: "app_id",
        header: "来源",
        cell: ({ row }) => (
          <span className="block max-w-36 truncate" title={row.original.app_id}>
            {row.original.app_id === "console"
              ? "管理后台"
              : row.original.app_id}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "上传时间",
        cell: ({ row }) => date(row.original.created_at),
      },
      {
        id: "actions",
        header: "操作",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label={`下载 ${row.original.original_filename}`}
            >
              <a href={`/api/files/${row.original.id}/download`}>
                <DownloadIcon />
              </a>
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                disabled={pending}
                aria-label={`删除 ${row.original.original_filename}`}
                onClick={() => onDelete(row.original)}
              >
                <Trash2Icon />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [onDelete, pending],
  )
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table exposes stateful helpers by design.
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    manualFiltering: true,
  })
  return (
    <div className="min-w-0 overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
