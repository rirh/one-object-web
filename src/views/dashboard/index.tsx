import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import {
  ArrowRightIcon,
  DatabaseIcon,
  FilesIcon,
  HardDriveIcon,
  KeyRoundIcon,
  UploadIcon,
} from "lucide-react"
import { Loading, Failure, NoItems } from "@/components/async-state"
import { SweepShine } from "@/components/sweep-shine"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { bytes, date } from "@/lib/format"
import { authPermissionsQuery } from "@/views/account/permissions-api"
import { listFiles } from "@/views/files/api"
import { listKeys } from "@/views/keys/api"
import { listConnections, PROVIDERS } from "@/views/storage/api"
import { getLiveness, getReadiness } from "./api"
import { MetricCard } from "./components/metric-card"
import { ServiceStatusCard } from "./components/service-status-card"

export default function Dashboard() {
  const access = useQuery(authPermissionsQuery)
  const can = (permission: string) =>
    access.data?.permissions.includes(permission) ?? false
  const canFiles = can("object:files:read")
  const canKeys = can("object:keys:list")
  const canStorage = can("object:storage:read")
  const files = useQuery({
    queryKey: ["files", 0, ""],
    queryFn: ({ signal }) => listFiles(0, "", signal),
    enabled: canFiles,
  })
  const keys = useQuery({
    queryKey: ["keys"],
    queryFn: ({ signal }) => listKeys(signal),
    enabled: canKeys,
  })
  const storage = useQuery({
    queryKey: ["storage-connections"],
    queryFn: ({ signal }) => listConnections(signal),
    enabled: canStorage,
  })
  const liveness = useQuery({
    queryKey: ["service-status", "liveness"],
    queryFn: getLiveness,
  })
  const readiness = useQuery({
    queryKey: ["service-status", "readiness"],
    queryFn: getReadiness,
  })
  const metric = (
    allowed: boolean,
    pending: boolean,
    value: string | number | undefined,
  ) =>
    !allowed ? "—" : pending ? <SweepShine>加载中</SweepShine> : (value ?? "—")
  if (access.isPending) return <Loading />
  if (access.error)
    return <Failure error={access.error} retry={() => void access.refetch()} />
  return (
    <section
      aria-labelledby="dashboard-heading"
      className="flex w-full flex-col gap-5 p-4 lg:gap-6 lg:p-5"
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        <h1 className="sr-only" id="dashboard-heading">
          仪表盘
        </h1>
        {can("object:uploads:write") && (
          <Button asChild>
            <Link to="/dashboard/uploads">
              <UploadIcon />
              上传文件
            </Link>
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="文件总数"
          icon={FilesIcon}
          value={metric(canFiles, files.isPending, files.data?.total)}
          detail={canFiles ? "当前账户可访问的文件" : "暂无文件查看权限"}
        />
        <MetricCard
          label="应用密钥"
          icon={KeyRoundIcon}
          value={metric(canKeys, keys.isPending, keys.data?.items.length)}
          detail={canKeys ? "当前账户的全部应用密钥" : "暂无密钥查看权限"}
        />
        <MetricCard
          label="已接入存储"
          icon={DatabaseIcon}
          value={metric(
            canStorage,
            storage.isPending,
            storage.data?.items.length,
          )}
          detail={canStorage ? "当前账户已接入的存储桶" : "暂无存储查看权限"}
        />
        <MetricCard
          label="启用存储"
          icon={HardDriveIcon}
          value={metric(
            canStorage,
            storage.isPending,
            storage.data?.items.filter((c) => c.enabled).length,
          )}
          detail="可用于新建上传的存储桶"
        />
      </div>
      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>最近上传</CardTitle>
            <CardDescription>当前账户最近上传的 6 个文件。</CardDescription>
            {canFiles && (
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard/files">
                    查看全部
                    <ArrowRightIcon />
                  </Link>
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="min-w-0">
            {!canFiles ? (
              <NoItems
                title="暂无查看权限"
                description="获得文件查看权限后可查看最近上传。"
              />
            ) : files.isPending ? (
              <Loading />
            ) : files.error ? (
              <Failure error={files.error} retry={() => void files.refetch()} />
            ) : files.data.items.length === 0 ? (
              <NoItems
                title="暂无文件"
                description="上传文件后，会在这里显示。"
              />
            ) : (
              <Table className="min-w-[28rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>上传时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.data.items.slice(0, 6).map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <span
                          className="block max-w-64 truncate"
                          title={file.original_filename}
                        >
                          {file.original_filename}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {bytes(file.file_size)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {date(file.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>存储信息</CardTitle>
            <CardDescription>文件存储位置与上传配置。</CardDescription>
          </CardHeader>
          <CardContent>
            {!canStorage ? (
              <NoItems
                title="暂无查看权限"
                description="获得存储查看权限后可查看配置。"
              />
            ) : storage.isPending ? (
              <Loading />
            ) : storage.error ? (
              <Failure
                error={storage.error}
                retry={() => void storage.refetch()}
              />
            ) : (
              <div className="grid gap-4">
                {storage.data.items.length ? (
                  storage.data.items.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {PROVIDERS[c.provider]} · {c.bucket}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {c.enabled ? "启用" : "停用"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <NoItems
                    title="尚未接入存储"
                    description="在厂商管理中添加账号，然后到桶管理同步或创建存储桶。"
                  />
                )}
                <Button asChild variant="outline">
                  <Link to="/dashboard/storage">厂商管理</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {keys.error && canKeys && (
        <Failure error={keys.error} retry={() => void keys.refetch()} />
      )}
      <section aria-labelledby="service-status-heading" className="grid gap-3">
        <h2 id="service-status-heading" className="text-sm font-medium">
          服务与资源
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ServiceStatusCard
            titleKey="status.liveness.title"
            descriptionKey="status.liveness.description"
            query={liveness}
          />
          <ServiceStatusCard
            titleKey="status.readiness.title"
            descriptionKey="status.readiness.description"
            query={readiness}
          />
          <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-2.5 sm:col-span-2 xl:col-span-1">
            <h3 className="text-sm font-medium">应用接入</h3>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/integration">
                接入指南
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </section>
  )
}
