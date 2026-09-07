import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { rootRequest } from "@/lib/request"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResourceTable } from "../shared/resource-table"
import { formatAdminTime } from "../shared/format"
type Log = {
  id: string
  owner_sub: string | null
  app_id?: string | null
  status: number
  success?: boolean
  method?: string
  route?: string
  duration_ms?: number
  peer_ip: string | null
  created_at: string
}
export function LogsPanel({ kind }: { kind: "login" | "operation" }) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "success" | "failure">("all")
  const logs = useInfiniteQuery({
    queryKey: ["object-admin", `${kind}-logs`],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      rootRequest<{ items: Log[]; total: number }>(
        `/api/admin/${kind}-logs?offset=${pageParam}`,
      ),
    getNextPageParam: (page, all) => {
      const n = all.reduce((sum, p) => sum + p.items.length, 0)
      return n < page.total ? n : undefined
    },
  })
  const columns = useMemo<ColumnDef<Log>[]>(
    () => [
      {
        accessorKey: "owner_sub",
        header: "操作人",
        cell: ({ getValue }) => getValue() || "未验证身份",
      },
      ...(kind === "operation"
        ? [
            { accessorKey: "method", header: "请求方式" },
            { accessorKey: "route", header: "操作路径" },
            { accessorKey: "duration_ms", header: "耗时 (ms)" },
          ]
        : []),
      {
        accessorKey: "status",
        header: "结果",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status < 400 ? "secondary" : "destructive"}
          >
            {row.original.status < 400 ? "成功" : "失败"} ·{" "}
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "peer_ip",
        header: "连接 IP",
        cell: ({ getValue }) => getValue() || "—",
      },
      {
        accessorKey: "created_at",
        header: "时间",
        cell: ({ getValue }) => formatAdminTime(getValue<string>()),
      },
    ],
    [kind],
  )
  const data = useMemo(
    () =>
      logs.data?.pages
        .flatMap((p) => p.items)
        .filter(
          (l) =>
            (filter === "all" ||
              (filter === "success" ? l.status < 400 : l.status >= 400)) &&
            `${l.owner_sub || ""} ${l.route || ""} ${l.peer_ip || ""}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        ) || [],
    [logs.data, search, filter],
  )
  return (
    <>
      <p className="px-5 py-3 text-xs text-muted-foreground">
        保留最近 7 天的{kind === "login" ? "登录" : "操作"}日志，由 PostgreSQL
        定期清理。
      </p>
      <ResourceTable
        data={data}
        columns={columns}
        searchValue={search}
        onSearchChange={setSearch}
        statusFilter={filter}
        onStatusFilterChange={setFilter}
        statusFilterOptions={[
          { value: "all", label: "全部" },
          { value: "success", label: "成功" },
          { value: "failure", label: "失败" },
        ]}
        searchPlaceholder="搜索已加载日志"
        isLoading={logs.isPending}
        isFetching={logs.isFetching}
        error={logs.error}
        onRefresh={() => void logs.refetch()}
        emptyLabel="暂无日志"
        getRowId={(l) => l.id}
      />
      {logs.hasNextPage && (
        <div className="flex justify-center p-4">
          <Button
            variant="outline"
            disabled={logs.isFetchingNextPage}
            onClick={() => void logs.fetchNextPage()}
          >
            加载更多日志
          </Button>
        </div>
      )}
    </>
  )
}
