import { useObjectTranslation } from "@/local/object"

import { useMutation } from "@tanstack/react-query"

import { zodResolver } from "@hookform/resolvers/zod"

import { connectionSchema } from "../schema"

import { ProviderHelp } from "../provider-help"

import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs"

import { useForm, useWatch } from "react-hook-form"

import { CircleHelpIcon } from "lucide-react"

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

import {
  PROVIDERS,
  createAccount,
  updateAccount,
  type ConnectionInput,
  type StorageAccount,
} from "../api"

export function ConnectionEditor({
  value,
  close,
  saved,
}: {
  value: StorageAccount | "new"
  close: () => void
  saved: () => void
}) {
  const tx = useObjectTranslation()

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
      toast.success(tx("存储接入已保存"))
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
            {existing ? tx("编辑接入") : tx("新增厂商接入")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {tx(
              "配置厂商账号，密钥在服务端加密保存。保存后可在桶管理中同步或创建存储桶。",
            )}
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
                    {tx("存储厂商")}{" "}
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                  </FieldLabel>
                  <ProviderHelp provider={provider} />
                </div>
                <AnimatedSegmentedTabs
                  label={tx("存储厂商")}
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
                {tx("名称")}{" "}
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
                      {provider === "oci" ? tx("区域") : tx("默认区域（可选）")}
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
                {tx(PROVIDERS[existing.provider])} · {existing.region}
                {tx("。默认区域用于请求签名，各桶可使用不同区域。")}
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
                        aria-label={tx("密钥配置说明")}
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
                        ? tx("两个密钥字段留空可保留原凭证。")
                        : tx(
                            "同步需要列桶权限，创建和删除需要对应的桶管理权限。",
                          )}
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
              {tx("取消")}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              <SweepShine active={save.isPending}>{tx("保存")}</SweepShine>
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
