import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { connectionSchema } from "./schema"
import { ProviderHelp } from "./provider-help"
import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"
import { useForm, useWatch } from "react-hook-form"
import {
  CircleHelpIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { ResourceTable } from "@/views/dashboard/admin/components/shared/resource-table"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  listAccounts,
  createAccount,
  updateAccount,
  checkAccount,
  deleteAccount,
  deleteAccounts,
  type ConnectionInput,
  type StorageAccount,
} from "./api"

type AccountConfirmation = {
  kind: "disable" | "delete"
  accounts: StorageAccount[]
  clearSelection?: () => void
}
export default function StoragePage() {
  const client = useQueryClient()
  const [editor, setEditor] = useState<StorageAccount | "new" | null>(null)
  const [confirmation, setConfirmation] = useState<AccountConfirmation | null>(
    null,
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "disabled"
  >("all")
  const access = useQuery(authPermissionsQuery)
  const canWrite =
    access.data?.permissions.includes("object:storage:write") ?? false
  const query = useQuery({
    queryKey: ["storage-accounts"],
    queryFn: ({ signal }) => listAccounts(signal),
  })
  const [refreshing, setRefreshing] = useState(false)
  const refreshResult = useRef<{ error: Error | null } | null>(null)
  const reloadAccounts = async () => {
    refreshResult.current = null
    setRefreshing(true)
    try {
      const result = await query.refetch({ throwOnError: true })
      refreshResult.current = { error: result.error }
    } catch (error) {
      refreshResult.current = {
        error: error instanceof Error ? error : new Error("刷新失败，请重试"),
      }
    }
  }
  const finishRefreshRotation = () => {
    const result = refreshResult.current
    if (!result) return
    refreshResult.current = null
    setRefreshing(false)
    if (result.error) toast.error(result.error.message)
    else toast.success("厂商列表已刷新")
  }
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["storage-accounts"] }),
      client.invalidateQueries({ queryKey: ["storage-connections"] }),
      client.invalidateQueries({ queryKey: ["storage-buckets"] }),
    ])
  }
  const toggle = useMutation({
    mutationFn: (account: StorageAccount) =>
      updateAccount(account.id, {
        name: account.name,
        enabled: !account.enabled,
      }),
    onSuccess: async (_, account) => {
      setConfirmation(null)
      toast.success(account.enabled ? "厂商已停用" : "厂商已启用")
      await refresh()
    },
    onError: (error) => toast.error(error.message),
  })
  const remove = useMutation({
    mutationFn: (accounts: StorageAccount[]) =>
      accounts.length === 1
        ? deleteAccount(accounts[0].id)
        : deleteAccounts(accounts.map((account) => account.id)),
    onSuccess: async (_, accounts) => {
      confirmation?.clearSelection?.()
      setConfirmation(null)
      toast.success(`已删除 ${accounts.length} 个厂商配置`)
      await refresh()
    },
    onError: (error) => toast.error(error.message),
  })
  const check = useMutation({
    mutationFn: checkAccount,
    onSuccess: (result) => toast.success(result.message),
    onError: (error) => toast.error(error.message),
  })
  const keyword = search.trim().toLowerCase()
  const data = (query.data?.items ?? []).filter(
    (account) =>
      (statusFilter === "all" ||
        account.enabled === (statusFilter === "active")) &&
      (!keyword ||
        [account.name, PROVIDERS[account.provider], account.region].some(
          (value) => value.toLowerCase().includes(keyword),
        )),
  )
  const columns: ColumnDef<StorageAccount>[] = [
    {
      accessorKey: "name",
      header: "厂商名称",
      cell: ({ row: { original: account } }) => (
        <div className="flex min-w-40 items-center gap-2">
          <img
            src={`/storage-providers/${account.provider}.svg`}
            alt=""
            className="size-5 shrink-0 object-contain"
          />
          <span
            className="truncate font-medium"
            title={PROVIDERS[account.provider]}
          >
            {account.name}
          </span>
        </div>
      ),
      meta: { label: "厂商名称", headerClassName: "w-[45%]" },
    },
    {
      accessorKey: "bucket_count",
      header: "桶数量",
      cell: ({ row: { original: account } }) => (
        <span className="tabular-nums" title="最近同步到本地的存储桶数量">
          {account.bucket_count == null ||
          (!account.synced_at && account.bucket_count === 0)
            ? "未同步"
            : `${account.bucket_count} 个`}
        </span>
      ),
      meta: { label: "桶数量" },
    },
    {
      accessorKey: "enabled",
      header: "状态",
      cell: ({ row: { original: account } }) => (
        <div className="flex items-center gap-2">
          <Switch
            size="sm"
            aria-label={`${account.name} 启用状态`}
            checked={account.enabled}
            disabled={!canWrite || toggle.isPending || remove.isPending}
            onCheckedChange={(enabled) => {
              if (enabled) toggle.mutate(account)
              else setConfirmation({ kind: "disable", accounts: [account] })
            }}
          />
          <span className="text-xs text-muted-foreground">
            {account.enabled ? "启用" : "停用"}
          </span>
        </div>
      ),
      meta: { label: "状态" },
    },
  ]
  const pending = toggle.isPending || remove.isPending
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <ResourceTable
        compact
        columns={columns}
        data={data}
        getRowId={(account) => account.id}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜索厂商名称"
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        isLoading={query.isPending}
        isFetching={query.isFetching || refreshing}
        error={query.error}
        onRefresh={() => void reloadAccounts()}
        onRefreshAnimationIteration={finishRefreshRotation}
        onCreate={canWrite ? () => setEditor("new") : undefined}
        createLabel="新增接入"
        emptyLabel="暂无厂商配置"
        isBulkDeleting={remove.isPending}
        onBulkDelete={
          canWrite
            ? (accounts, clearSelection) =>
                setConfirmation({ kind: "delete", accounts, clearSelection })
            : undefined
        }
        renderRowActions={(account) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label={`${account.name} 操作`}
                disabled={remove.isPending}
              >
                {check.isPending && check.variables === account.id ? (
                  <RefreshCwIcon className="animate-spin" />
                ) : (
                  <MoreHorizontalIcon />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={check.isPending || !account.enabled}
                  onSelect={() => check.mutate(account.id)}
                >
                  <RefreshCwIcon />
                  检测连接
                </DropdownMenuItem>
                {canWrite && (
                  <DropdownMenuItem onSelect={() => setEditor(account)}>
                    <PencilIcon />
                    编辑
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              {canWrite && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() =>
                      setConfirmation({ kind: "delete", accounts: [account] })
                    }
                  >
                    <Trash2Icon />
                    删除
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
      {editor && (
        <ConnectionEditor
          value={editor}
          close={() => setEditor(null)}
          saved={() => void refresh()}
        />
      )}
      <ResponsiveDialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirmation(null)
        }}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {confirmation?.kind === "disable"
                ? "停用厂商"
                : `删除 ${confirmation?.accounts.length ?? 0} 个厂商配置`}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {confirmation?.kind === "disable"
                ? "停用后，该厂商不能用于新上传及云端桶管理；已有文件和未完成上传仍保留。"
                : "删除所选厂商及其本地桶接入配置，云端桶和对象不受影响。有关联文件或未完成上传时，整批操作将被拒绝。"}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
              {confirmation?.accounts.map((account) => (
                <li key={account.id}>{account.name}</li>
              ))}
            </ul>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmation(null)}
            >
              取消
            </Button>
            <Button
              variant={
                confirmation?.kind === "delete" ? "destructive" : "default"
              }
              disabled={pending}
              onClick={() => {
                if (!confirmation) return
                if (confirmation.kind === "disable")
                  toggle.mutate(confirmation.accounts[0])
                else remove.mutate(confirmation.accounts)
              }}
            >
              <SweepShine active={pending}>
                {confirmation?.kind === "disable" ? "确认停用" : "确认删除"}
              </SweepShine>
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </section>
  )
}
function ConnectionEditor({
  value,
  close,
  saved,
}: {
  value: StorageAccount | "new"
  close: () => void
  saved: () => void
}) {
  const existing = value === "new" ? null : value
  const form = useForm<ConnectionInput>({
    resolver: zodResolver(connectionSchema(Boolean(existing), true)),
    defaultValues: {
      name: existing?.name ?? "",
      provider: existing?.provider ?? "r2",
      bucket: "",
      region: existing?.region ?? "",
      account_id: "",
      access_key: "",
      secret_key: "",
    },
  })
  const provider = useWatch({ control: form.control, name: "provider" })
  const save = useMutation({
    mutationFn: async (input: ConnectionInput) => {
      await (existing
        ? updateAccount(existing.id, {
            name: input.name,
            enabled: existing.enabled,
            ...(input.access_key || input.secret_key
              ? { access_key: input.access_key, secret_key: input.secret_key }
              : {}),
          })
        : createAccount(input))
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
      <ResponsiveDialogContent className="flex max-h-[90svh] flex-col sm:max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {existing ? "编辑接入" : "新增厂商接入"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            配置厂商账号，密钥在服务端加密保存。保存后可在桶管理中同步或创建存储桶。
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          className="flex min-h-0 flex-col"
          noValidate
          onSubmit={form.handleSubmit((input) => save.mutate(input))}
        >
          <ResponsiveDialogBody className="grid gap-x-4 gap-y-3 overflow-y-auto sm:grid-cols-2 [&_[data-slot=field]]:gap-1.5 [&_[data-slot=input]]:h-8">
            {!existing && (
              <Field className="sm:col-span-2">
                <div className="flex items-center gap-1.5">
                  <FieldLabel>
                    存储厂商{" "}
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                  </FieldLabel>
                  <ProviderHelp provider={provider} />
                </div>
                <AnimatedSegmentedTabs
                  label="存储厂商"
                  value={provider}
                  options={Object.entries(PROVIDERS).map(([value, label]) => ({
                    value: value as ConnectionInput["provider"],
                    label: (
                      <>
                        <img
                          src={`/storage-providers/${value}.svg`}
                          alt=""
                          aria-hidden="true"
                          className="size-4 shrink-0 object-contain"
                        />
                        {label}
                      </>
                    ),
                    disabled: save.isPending,
                  }))}
                  onValueChange={(value) => {
                    form.setValue("provider", value, { shouldDirty: true })
                    form.clearErrors()
                  }}
                  className="min-w-0"
                  listClassName="grid h-auto w-fit max-w-full grid-cols-2 sm:flex sm:flex-wrap"
                  triggerClassName="h-7 flex-none gap-1.5 px-2 text-xs"
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="connection-name">
                名称{" "}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </FieldLabel>
              <Input
                id="connection-name"
                aria-invalid={!!form.formState.errors.name}
                aria-describedby="connection-name-error"
                required
                maxLength={100}
                {...form.register("name")}
              />
              <FieldError
                id="connection-name-error"
                errors={[form.formState.errors.name]}
              />
            </Field>
            {!existing && (
              <>
                {(provider === "r2" || provider === "oci") && (
                  <Field>
                    <FieldLabel htmlFor="connection-account">
                      {provider === "oci"
                        ? "Object Storage Namespace"
                        : "Cloudflare Account ID"}{" "}
                      <span className="text-destructive" aria-hidden="true">
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      id="connection-account"
                      aria-invalid={!!form.formState.errors.account_id}
                      aria-describedby="connection-account-error"
                      required
                      maxLength={provider === "oci" ? 100 : 32}
                      {...form.register("account_id")}
                    />
                    <FieldError
                      id="connection-account-error"
                      errors={[form.formState.errors.account_id]}
                    />
                  </Field>
                )}
                {provider !== "r2" && (
                  <Field>
                    <FieldLabel htmlFor="connection-region">
                      {provider === "oci" ? "区域" : "默认区域（可选）"}
                      {provider === "oci" && (
                        <span className="text-destructive" aria-hidden="true">
                          {" "}
                          *
                        </span>
                      )}
                    </FieldLabel>
                    <Input
                      id="connection-region"
                      aria-invalid={!!form.formState.errors.region}
                      aria-describedby="connection-region-error"
                      required={provider === "oci"}
                      {...form.register("region")}
                      placeholder={
                        provider === "aws"
                          ? "us-east-1"
                          : provider === "aliyun"
                            ? "cn-hangzhou"
                            : provider === "oci"
                              ? "ap-singapore-1"
                              : "ap-guangzhou"
                      }
                    />
                    <FieldError
                      id="connection-region-error"
                      errors={[form.formState.errors.region]}
                    />
                  </Field>
                )}
              </>
            )}
            {existing && (
              <p className="text-sm text-muted-foreground sm:col-span-2">
                {PROVIDERS[existing.provider]} · {existing.region}
                。默认区域用于请求签名，各桶可使用不同区域。
              </p>
            )}
            <Field>
              <FieldLabel htmlFor="connection-access">
                {provider === "tencent" ? "SecretId" : "Access Key ID"}
                {!existing && (
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                )}
              </FieldLabel>
              <Input
                id="connection-access"
                aria-invalid={!!form.formState.errors.access_key}
                aria-describedby="connection-access-error"
                required={!existing}
                autoComplete="off"
                {...form.register("access_key")}
              />
              <FieldError
                id="connection-access-error"
                errors={[form.formState.errors.access_key]}
              />
            </Field>
            <Field>
              <div className="flex items-center gap-1.5">
                <FieldLabel htmlFor="connection-secret">
                  {provider === "tencent" ? "SecretKey" : "Secret Access Key"}
                  {!existing && (
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                  )}
                </FieldLabel>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger
                      asChild
                      onFocus={(event) => event.preventDefault()}
                    >
                      <button
                        type="button"
                        aria-label="密钥配置说明"
                        className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <CircleHelpIcon className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      showArrow={false}
                      side="top"
                      sideOffset={6}
                      className="max-w-xs leading-relaxed"
                    >
                      {existing
                        ? "两个密钥字段留空可保留原凭证。"
                        : "同步需要列桶权限，创建和删除需要对应的桶管理权限。"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="connection-secret"
                aria-invalid={!!form.formState.errors.secret_key}
                aria-describedby="connection-secret-error"
                type="password"
                required={!existing}
                autoComplete="new-password"
                {...form.register("secret_key")}
              />
              <FieldError
                id="connection-secret-error"
                errors={[form.formState.errors.secret_key]}
              />
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
