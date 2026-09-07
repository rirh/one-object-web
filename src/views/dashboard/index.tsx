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
import { PageHeader } from "@/components/page-header"
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
import { getStorage } from "@/views/storage/api"
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
    queryKey: ["storage"],
    queryFn: ({ signal }) => getStorage(signal),
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          eyebrow="对象存储概览"
          title={<span id="dashboard-heading">仪表盘</span>}
          description="查看文件、应用密钥与存储配置，管理对象存储资源。"
        />
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
          label="存储配置"
          icon={DatabaseIcon}
          value={metric(
            canStorage,
            storage.isPending,
            storage.data
              ? storage.data.configured
                ? "已配置"
                : "待配置"
              : undefined,
          )}
          detail={canStorage ? "S3 兼容存储 · 连接未检测" : "暂无存储查看权限"}
        />
        <MetricCard
          label="单文件上限"
          icon={HardDriveIcon}
          value={metric(
            canStorage,
            storage.isPending,
            storage.data ? bytes(storage.data.max_file_size) : undefined,
          )}
          detail="分片上传支持的最大文件大小"
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
              <Table>
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
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-5 text-sm">
                <dt className="text-muted-foreground">配置状态</dt>
                <dd>
                  <Badge variant="secondary">
                    {storage.data.configured
                      ? "已配置（连接未检测）"
                      : "待配置"}
                  </Badge>
                </dd>
                <dt className="text-muted-foreground">Bucket</dt>
                <dd className="break-all">{storage.data.bucket || "—"}</dd>
                <dt className="text-muted-foreground">Region</dt>
                <dd className="break-all">{storage.data.region || "—"}</dd>
                <dt className="text-muted-foreground">分片大小</dt>
                <dd>{bytes(storage.data.part_size)}</dd>
                <dt className="text-muted-foreground">下载方式</dt>
                <dd>鉴权后生成临时下载地址</dd>
              </dl>
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
