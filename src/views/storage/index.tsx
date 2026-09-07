import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Loading, Failure, NoItems } from "@/components/async-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
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
import {
  PROVIDERS,
  listConnections,
  createConnection,
  updateConnection,
  checkConnection,
  type ConnectionInput,
  type StorageConnection,
  type Provider,
} from "./api"

export default function StoragePage() {
  const client = useQueryClient()
  const [editor, setEditor] = useState<StorageConnection | "new" | null>(null)
  const access = useQuery(authPermissionsQuery)
  const canWrite = access.data?.permissions.includes("object:storage:write")
  const query = useQuery({
    queryKey: ["storage-connections"],
    queryFn: ({ signal }) => listConnections(signal),
  })
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["storage-connections"] })
  }
  const toggle = useMutation({
    mutationFn: (c: StorageConnection) =>
      updateConnection(c.id, { name: c.name, enabled: !c.enabled }),
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  })
  const check = useMutation({
    mutationFn: checkConnection,
    onSuccess: (r) => toast.success(r.message),
    onError: (e) => toast.error(e.message),
  })
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          eyebrow="对象存储"
          title="厂商接入"
          description="接入已有存储桶，支持同一厂商配置多个存储。"
        />
        {canWrite && (
          <Button onClick={() => setEditor("new")}>
            <PlusIcon />
            新增接入
          </Button>
        )}
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : !query.data.items.length ? (
        <NoItems
          title="尚未接入存储厂商"
          description="新增 Cloudflare R2、AWS S3、阿里云 OSS 或腾讯云 COS 存储桶后，即可上传文件。"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {["名称", "厂商", "Bucket / 区域", "状态", "操作"].map((t) => (
                  <TableHead key={t}>{t}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{PROVIDERS[c.provider]}</TableCell>
                  <TableCell>
                    <div>{c.bucket}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.region}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.enabled ? "secondary" : "outline"}>
                      {c.enabled ? "启用" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={check.isPending}
                        onClick={() => check.mutate(c.id)}
                      >
                        <SweepShine
                          active={check.isPending && check.variables === c.id}
                        >
                          检测连接
                        </SweepShine>
                      </Button>
                      {canWrite && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditor(c)}
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={toggle.isPending}
                            onClick={() => toggle.mutate(c)}
                          >
                            {c.enabled ? "停用" : "启用"}
                          </Button>
                        </>
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
        <ConnectionEditor
          value={editor}
          close={() => setEditor(null)}
          saved={refresh}
        />
      )}
    </div>
  )
}
function ConnectionEditor({
  value,
  close,
  saved,
}: {
  value: StorageConnection | "new"
  close: () => void
  saved: () => void
}) {
  const existing = value === "new" ? null : value
  const [provider, setProvider] = useState<Provider>(existing?.provider ?? "r2")
  const form = useForm<ConnectionInput>({
    defaultValues: {
      name: existing?.name ?? "",
      provider,
      bucket: existing?.bucket ?? "",
      region: existing?.region ?? "",
      account_id: "",
      access_key: "",
      secret_key: "",
    },
  })
  const save = useMutation({
    mutationFn: async (input: ConnectionInput) => {
      await (existing
        ? updateConnection(existing.id, {
            name: input.name,
            enabled: existing.enabled,
            ...(input.access_key || input.secret_key
              ? { access_key: input.access_key, secret_key: input.secret_key }
              : {}),
          })
        : createConnection({ ...input, provider }))
    },
    onSuccess: () => {
      toast.success("存储接入已保存")
      saved()
      close()
    },
    onError: (e) => toast.error(e.message),
  })
  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open && !save.isPending) close()
      }}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {existing ? "编辑接入" : "新增厂商接入"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            密钥仅保存在服务端并加密存储。配置区域和 Bucket
            后，服务地址由系统生成。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form onSubmit={form.handleSubmit((input) => save.mutate(input))}>
          <ResponsiveDialogBody className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="connection-name">名称</FieldLabel>
              <Input
                id="connection-name"
                required
                maxLength={100}
                {...form.register("name")}
              />
            </Field>
            {!existing && (
              <>
                <Field>
                  <FieldLabel>存储厂商</FieldLabel>
                  <Select
                    value={provider}
                    onValueChange={(v) => setProvider(v as Provider)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROVIDERS).map(([id, label]) => (
                        <SelectItem key={id} value={id}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="connection-bucket">Bucket</FieldLabel>
                  <Input
                    id="connection-bucket"
                    required
                    {...form.register("bucket")}
                    placeholder={
                      provider === "tencent"
                        ? "example-1250000000"
                        : "example-bucket"
                    }
                  />
                </Field>
                {provider === "r2" ? (
                  <Field>
                    <FieldLabel htmlFor="connection-account">
                      Cloudflare Account ID
                    </FieldLabel>
                    <Input
                      id="connection-account"
                      required
                      maxLength={32}
                      {...form.register("account_id")}
                    />
                  </Field>
                ) : (
                  <Field>
                    <FieldLabel htmlFor="connection-region">区域</FieldLabel>
                    <Input
                      id="connection-region"
                      required
                      {...form.register("region")}
                      placeholder={
                        provider === "aws"
                          ? "us-east-1"
                          : provider === "aliyun"
                            ? "cn-hangzhou"
                            : "ap-guangzhou"
                      }
                    />
                  </Field>
                )}
              </>
            )}
            {existing && (
              <p className="text-sm text-muted-foreground">
                {PROVIDERS[existing.provider]} · {existing.bucket} ·{" "}
                {existing.region}。存储位置固定，迁移时请新增接入。
              </p>
            )}
            <Field>
              <FieldLabel htmlFor="connection-access">
                {provider === "tencent" ? "SecretId" : "Access Key ID"}
              </FieldLabel>
              <Input
                id="connection-access"
                required={!existing}
                autoComplete="off"
                {...form.register("access_key")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="connection-secret">
                {provider === "tencent" ? "SecretKey" : "Secret Access Key"}
              </FieldLabel>
              <Input
                id="connection-secret"
                type="password"
                required={!existing}
                autoComplete="new-password"
                {...form.register("secret_key")}
              />
              <FieldDescription>
                {existing
                  ? "两个密钥字段留空可保留原凭证。"
                  : "请使用仅能访问目标存储桶的专用凭证。"}
              </FieldDescription>
            </Field>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={save.isPending}
              onClick={close}
            >
              取消
            </Button>
            <Button type="submit" disabled={save.isPending}>
              <SweepShine active={save.isPending}>保存</SweepShine>
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
