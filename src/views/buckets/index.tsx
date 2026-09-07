import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import { PlusIcon, RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import { Loading, Failure, NoItems } from "@/components/async-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog"
import { SweepShine } from "@/components/sweep-shine"
import { authPermissionsQuery } from "@/views/account/permissions-api"
import { listAccounts, updateConnection, PROVIDERS } from "@/views/storage/api"
import {
  listBuckets,
  syncBuckets,
  createBucket,
  deleteBucket,
  type Bucket,
} from "./api"

const states = {
  unknown: "未同步",
  present: "云端存在",
  missing: "云端未找到",
  deleted: "已删除",
}
export default function BucketsPage() {
  const client = useQueryClient()
  const access = useQuery(authPermissionsQuery)
  const can = (action: string) =>
    access.data?.permissions.includes(`object:bucket:${action}`)
  const accounts = useQuery({
    queryKey: ["storage-accounts"],
    queryFn: ({ signal }) => listAccounts(signal),
  })
  const [selected, setSelected] = useState("")
  const account =
    accounts.data?.items.find((item) => item.id === selected) ??
    accounts.data?.items[0]
  const accountId = account?.id ?? ""
  const buckets = useQuery({
    queryKey: ["storage-buckets", accountId],
    queryFn: ({ signal }) => listBuckets(accountId, signal),
    enabled: !!accountId,
  })
  const [editor, setEditor] = useState<"new" | Bucket | null>(null)
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["storage-buckets", accountId] })
    void client.invalidateQueries({ queryKey: ["storage-connections"] })
    void client.invalidateQueries({ queryKey: ["storage-accounts"] })
  }
  const toggle = useMutation({
    mutationFn: (bucket: Bucket) =>
      updateConnection(bucket.id, {
        name: bucket.name,
        enabled: !bucket.enabled,
      }),
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  })
  const sync = useMutation({
    mutationFn: () => syncBuckets(accountId),
    onSuccess: (result) => {
      toast.success(`已同步 ${result.count} 个云端存储桶`)
      refresh()
    },
    onError: (e) => toast.error(e.message),
  })
  if (accounts.isPending) return <Loading />
  if (accounts.error)
    return (
      <Failure error={accounts.error} retry={() => void accounts.refetch()} />
    )
  if (!account)
    return (
      <NoItems
        title="尚未配置厂商账号"
        description="请先在厂商管理中添加账号，然后同步云端桶列表。"
      />
    )
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={accountId}
          disabled={sync.isPending || !!editor}
          onValueChange={setSelected}
        >
          <SelectTrigger className="w-full sm:w-80" aria-label="厂商账号">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {accounts.data.items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} · {PROVIDERS[item.provider]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {can("sync") && (
            <Button
              variant="outline"
              disabled={!account.enabled || sync.isPending || !!editor}
              onClick={() => sync.mutate()}
            >
              <RefreshCwIcon />
              <SweepShine active={sync.isPending}>同步云端</SweepShine>
            </Button>
          )}
          {can("create") && (
            <Button
              disabled={!account.enabled || sync.isPending}
              onClick={() => setEditor("new")}
            >
              <PlusIcon />
              创建桶
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {account.provider === "oci"
          ? `当前 OCI 区域：${account.region}`
          : "当前厂商账号的全部区域"}{" "}
        ·{" "}
        {buckets.data?.synced_at
          ? `上次完整同步：${new Date(buckets.data.synced_at * 1000).toLocaleString()}`
          : "尚未同步，点击同步云端获取已有存储桶"}
        {!account.enabled && " · 厂商账号已停用"}
      </p>
      {buckets.isPending ? (
        <Loading />
      ) : buckets.error ? (
        <Failure error={buckets.error} retry={() => void buckets.refetch()} />
      ) : !buckets.data.items.length ? (
        <NoItems
          title="暂无存储桶"
          description="同步云端已有桶，或直接创建一个新桶。"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-[36rem]">
            <TableHeader>
              <TableRow>
                {["桶名称", "区域", "同步状态", "操作"].map((title) => (
                  <TableHead key={title}>{title}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {buckets.data.items.map((bucket) => (
                <TableRow key={bucket.id}>
                  <TableCell className="font-medium">{bucket.bucket}</TableCell>
                  <TableCell>{bucket.region}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        bucket.cloud_state === "present"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {states[bucket.cloud_state]}
                    </Badge>
                    {!bucket.enabled && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        接入已停用
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {access.data?.permissions.includes(
                        "object:files:read",
                      ) && (
                        <Button size="sm" variant="ghost" asChild>
                          <Link
                            to={`/dashboard/files?storage=${encodeURIComponent(bucket.id)}`}
                          >
                            文件
                          </Link>
                        </Button>
                      )}
                      {access.data?.permissions.includes(
                        "object:storage:write",
                      ) &&
                        bucket.cloud_state === "present" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={
                              !account.enabled ||
                              toggle.isPending ||
                              sync.isPending
                            }
                            onClick={() => toggle.mutate(bucket)}
                          >
                            {bucket.enabled ? "停用接入" : "启用接入"}
                          </Button>
                        )}
                      {can("delete") && bucket.cloud_state === "present" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          disabled={!account.enabled || sync.isPending}
                          onClick={() => setEditor(bucket)}
                        >
                          删除云端桶
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {editor && (
        <BucketDialog
          accountId={accountId}
          provider={account.provider}
          defaultRegion={account.region}
          value={editor}
          close={() => setEditor(null)}
          saved={refresh}
        />
      )}
    </div>
  )
}
function BucketDialog({
  accountId,
  provider,
  defaultRegion,
  value,
  close,
  saved,
}: {
  accountId: string
  provider: string
  defaultRegion: string
  value: "new" | Bucket
  close: () => void
  saved: () => void
}) {
  const creating = value === "new"
  const [name, setName] = useState("")
  const [region, setRegion] = useState(defaultRegion)
  const mutation = useMutation({
    mutationFn: async () => {
      if (creating) await createBucket(accountId, name.trim(), region.trim())
      else await deleteBucket(accountId, value.bucket, name)
    },
    onSuccess: () => {
      toast.success(creating ? "云端存储桶已创建" : "云端存储桶已删除")
      saved()
      close()
    },
    onError: (e) => toast.error(e.message),
  })
  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) close()
      }}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {creating ? "创建云端存储桶" : "删除云端存储桶"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {creating
              ? "选择存储桶区域，创建私有桶并接入文件上传。"
              : `将直接删除云端桶「${value.bucket}」。仅支持空桶；存在文件、历史版本或未完成分片时会拒绝删除。`}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
        >
          <ResponsiveDialogBody className="space-y-4">
            {creating && !["r2", "oci"].includes(provider) && (
              <Field>
                <FieldLabel htmlFor="bucket-region">桶区域</FieldLabel>
                <Input
                  id="bucket-region"
                  required
                  value={region}
                  disabled={mutation.isPending}
                  onChange={(event) => setRegion(event.target.value)}
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="bucket-name">
                {creating ? "桶名称" : "输入完整桶名确认删除"}
              </FieldLabel>
              <Input
                id="bucket-name"
                required
                autoComplete="off"
                disabled={mutation.isPending}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={provider === "oci" ? 256 : 63}
                placeholder={
                  creating
                    ? provider === "tencent"
                      ? "example-1250000000"
                      : "example-bucket"
                    : value.bucket
                }
              />
              {creating && (
                <FieldDescription>
                  {provider === "oci"
                    ? "使用 1–256 位大小写字母、数字、连字符、下划线和点号"
                    : "使用 3–63 位小写字母、数字和连字符"}
                  {provider === "aws" ? "，也可包含点号" : ""}
                  {provider === "tencent" ? "，并包含 APPID 后缀" : ""}。
                </FieldDescription>
              )}
            </Field>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={close}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant={creating ? "default" : "destructive"}
              disabled={
                mutation.isPending ||
                !name.trim() ||
                (!creating && name !== value.bucket)
              }
            >
              <SweepShine active={mutation.isPending}>
                {creating ? "创建" : "确认删除云端桶"}
              </SweepShine>
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
