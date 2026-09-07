import { PageHeader } from "@/components/page-header"
import { useCurrentTime } from "@/hooks/use-current-time"
import { fromUnixTime, isBefore } from "date-fns"
import { authPermissionsQuery } from "@/views/account/permissions-api"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { SweepShine } from "@/components/sweep-shine"
import { Loading, Failure, NoItems } from "@/components/async-state"
import { date } from "@/lib/format"
import { createKey, listKeys, revokeKey } from "./api"
const scopes = [
  ["uploads:write", "上传文件"],
  ["files:read", "读取文件"],
  ["files:delete", "删除文件"],
] as const
const schema = z.object({
  name: z.string().trim().min(1, "请输入应用名称").max(100),
  expires_in_days: z.number().int().min(1).max(365),
  scopes: z.array(z.string()).min(1, "至少选择一个权限"),
})
type Form = z.infer<typeof schema>
export default function KeysPage() {
  const now = useCurrentTime()
  const access = useQuery(authPermissionsQuery)
  const permissions = access.data?.permissions || []
  const client = useQueryClient()
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      expires_in_days: 90,
      scopes: ["uploads:write", "files:read"].filter((scope) =>
        permissions.includes(`object:${scope}`),
      ),
    },
  })
  const query = useQuery({
    queryKey: ["keys"],
    queryFn: ({ signal }) => listKeys(signal),
  })
  const create = useMutation({
    mutationFn: createKey,
    gcTime: 0,
    onSuccess: () => {
      form.reset()
      void client.invalidateQueries({ queryKey: ["keys"] })
    },
  })
  const revoke = useMutation({
    mutationFn: revokeKey,
    onSuccess: () => {
      toast.success("密钥已撤销")
      void client.invalidateQueries({ queryKey: ["keys"] })
    },
    onError: (error) => toast.error(error.message),
  })
  const copy = useMutation({
    mutationFn: (value: string) => navigator.clipboard.writeText(value),
    onSuccess: () => toast.success("已复制"),
    onError: () => toast.error("复制失败，请手动选择并复制"),
  })
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="对象存储"
        title="应用密钥"
        description="每个密钥使用独立的应用空间，只能访问自己上传的文件。"
      />
      {permissions.includes("object:keys:create") && (
        <form
          className="max-w-xl"
          onSubmit={form.handleSubmit((input) => create.mutate(input))}
        >
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="app-name">应用名称</FieldLabel>
              <Input
                id="app-name"
                placeholder="例如 One Mail"
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="key-days">有效天数</FieldLabel>
              <Input
                id="key-days"
                type="number"
                min={1}
                max={365}
                {...form.register("expires_in_days", { valueAsNumber: true })}
              />
              <FieldError>
                {form.formState.errors.expires_in_days?.message}
              </FieldError>
            </Field>
            <FieldSet>
              <FieldLegend>权限</FieldLegend>
              <div className="flex flex-wrap gap-4">
                {scopes
                  .filter(([value]) => permissions.includes(`object:${value}`))
                  .map(([value, label]) => (
                    <Field key={value} orientation="horizontal">
                      <Controller
                        control={form.control}
                        name="scopes"
                        render={({ field }) => (
                          <Checkbox
                            id={value}
                            checked={field.value.includes(value)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, value]
                                  : field.value.filter(
                                      (scope) => scope !== value,
                                    ),
                              )
                            }
                          />
                        )}
                      />
                      <FieldLabel htmlFor={value}>{label}</FieldLabel>
                    </Field>
                  ))}
              </div>
              <FieldError>{form.formState.errors.scopes?.message}</FieldError>
            </FieldSet>
            <Button
              className="self-start"
              type="submit"
              disabled={create.isPending || !!create.data}
              aria-busy={create.isPending}
            >
              <SweepShine active={create.isPending}>创建密钥</SweepShine>
            </Button>
          </FieldGroup>
        </form>
      )}
      {create.error ? <Failure error={create.error} /> : null}
      {create.data ? (
        <Alert>
          <AlertTitle>密钥仅显示一次</AlertTitle>
          <AlertDescription>
            <p>保存到接入应用的服务端环境变量中。</p>
            <Input
              aria-label="新建应用密钥"
              readOnly
              value={create.data.token}
              className="font-mono"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={copy.isPending}
                aria-busy={copy.isPending}
                onClick={() => copy.mutate(create.data.token)}
              >
                <SweepShine active={copy.isPending}>复制密钥</SweepShine>
              </Button>
              <Button variant="outline" onClick={() => create.reset()}>
                已保存，关闭
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
      <h2 className="text-base font-medium">已有密钥</h2>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : query.data.items.length ? (
        <ul className="divide-y rounded-md border">
          {query.data.items.map((key) => (
            <li
              key={key.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{key.name}</span>
                  <Badge variant="secondary">
                    {key.revoked
                      ? "已撤销"
                      : isBefore(fromUnixTime(key.expires_at), now)
                        ? "已过期"
                        : "有效"}
                  </Badge>
                </div>
                <code className="break-all text-xs text-muted-foreground">
                  {key.id}
                </code>
                <p className="text-xs text-muted-foreground">
                  {key.scopes.join(" · ")} · {date(key.expires_at)} 到期
                </p>
              </div>
              <Button
                variant="outline"
                disabled={
                  key.revoked ||
                  revoke.isPending ||
                  !permissions.includes("object:keys:revoke")
                }
                aria-busy={revoke.isPending && revoke.variables === key.id}
                onClick={() => {
                  if (
                    window.confirm(
                      `撤销 ${key.name} 的密钥？接入应用将停止访问。`,
                    )
                  )
                    revoke.mutate(key.id)
                }}
              >
                <SweepShine
                  active={revoke.isPending && revoke.variables === key.id}
                >
                  撤销
                </SweepShine>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <NoItems
          title="暂无应用密钥"
          description="创建密钥后，其他应用即可接入统一上传。"
        />
      )}
    </div>
  )
}
