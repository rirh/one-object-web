import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { useObjectTranslation } from "@/local/object"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { DialogActionButton } from "@/components/ui/dialog-action-button"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { authPermissionsQuery } from "@/views/dashboard/account/permissions-api"
import {
  createKey,
  keyScopes,
  rbacQueryKeys,
  updateKey,
  type AppKey,
  type AppKeyInput,
} from "./api"
import { AdminErrorAlert } from "@/views/dashboard/admin/components/shared/common"

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "请输入应用名称")
    .max(100, "名称最多 100 个字符"),
  expires_in_days: z
    .number()
    .int("有效天数必须为整数")
    .min(1, "有效天数至少为 1 天")
    .max(365, "有效天数最多为 365 天"),
  scopes: z.array(z.string()).min(1, "至少选择一个权限"),
})

type Form = z.infer<typeof schema>
export type KeyDialogState =
  | { kind: "create" }
  | { kind: "edit"; key: AppKey }
  | null

function defaultExpiryDays(key: AppKey | undefined) {
  if (!key) return 90
  return Math.min(
    365,
    Math.max(1, Math.ceil((key.expires_at - Date.now() / 1000) / 86400)),
  )
}

export function KeyDialog({
  dialog,
  permissions,
  onCreated,
  onOpenChange,
}: {
  dialog: KeyDialogState
  permissions: string[]
  onCreated: (token: string) => void
  onOpenChange: (open: boolean) => void
}) {
  const tx = useObjectTranslation()
  const client = useQueryClient()
  const editing = dialog?.kind === "edit" ? dialog.key : undefined
  const allowedScopes = keyScopes.filter(([scope]) =>
    permissions.includes(`object:${scope}`),
  )
  const visibleScopes = keyScopes.filter(
    ([scope]) =>
      permissions.includes(`object:${scope}`) ||
      editing?.scopes.includes(scope),
  )
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: editing?.name ?? "",
      expires_in_days: defaultExpiryDays(editing),
      scopes:
        editing?.scopes ??
        ["uploads:write", "files:read"].filter((scope) =>
          permissions.includes(`object:${scope}`),
        ),
    },
  })
  const mutation = useMutation({
    mutationFn: async (input: AppKeyInput) => {
      if (editing) {
        await updateKey(editing.id, input)
        return null
      }
      return createKey(input)
    },
    onSuccess: async (created) => {
      await client.invalidateQueries({ queryKey: ["keys"] })
      await client.invalidateQueries({ queryKey: authPermissionsQuery.queryKey })
      onOpenChange(false)
      if (created) onCreated(created.token)
      toast.success(editing ? tx("授权已修改") : tx("授权已创建"))
    },
  })

  return (
    <ResponsiveDialog open={dialog !== null} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90svh] sm:max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {editing ? tx("编辑授权") : tx("新增授权")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {editing
              ? tx("修改授权信息不会生成新的 Token。")
              : tx("Token 只会在创建成功后显示一次，请保存到应用后端。")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="overflow-y-auto">
          <form
            id="key-editor-form"
            onSubmit={form.handleSubmit((input) => mutation.mutate(input))}
          >
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.name}>
                <FieldLabel htmlFor="key-name">{tx("应用名称")}</FieldLabel>
                <Input
                  id="key-name"
                  autoComplete="off"
                  maxLength={100}
                  {...form.register("name")}
                />
                <FieldError>{form.formState.errors.name?.message}</FieldError>
              </Field>
              <Field
                data-invalid={!!form.formState.errors.expires_in_days}
              >
                <FieldLabel htmlFor="key-days">{tx("有效天数")}</FieldLabel>
                <Input
                  id="key-days"
                  type="number"
                  min={1}
                  max={365}
                  {...form.register("expires_in_days", {
                    valueAsNumber: true,
                  })}
                />
                <FieldError>
                  {form.formState.errors.expires_in_days?.message}
                </FieldError>
              </Field>
              <FieldSet>
                <FieldLegend>{tx("权限")}</FieldLegend>
                <div className="flex flex-wrap gap-4">
                  {visibleScopes.map(([scope, label]) => {
                    const id = `key-scope-${scope.replace(":", "-")}`
                    const disabled = !permissions.includes(`object:${scope}`)
                    return (
                      <Field key={scope} orientation="horizontal">
                        <Controller
                          control={form.control}
                          name="scopes"
                          render={({ field }) => (
                            <Checkbox
                              id={id}
                              disabled={disabled}
                              checked={field.value.includes(scope)}
                              onCheckedChange={(checked) =>
                                field.onChange(
                                  checked
                                    ? [...field.value, scope]
                                    : field.value.filter(
                                        (value) => value !== scope,
                                      ),
                                )
                              }
                            />
                          )}
                        />
                        <FieldLabel htmlFor={id}>
                          {tx(label)}
                          {disabled ? ` · ${tx("无此权限")}` : ""}
                        </FieldLabel>
                      </Field>
                    )
                  })}
                </div>
                <FieldError>
                  {form.formState.errors.scopes?.message}
                </FieldError>
                {allowedScopes.length === 0 ? (
                  <p className="text-sm text-destructive">
                    {tx("当前账号没有可授予的应用权限。")}
                  </p>
                ) : null}
              </FieldSet>
              {mutation.error ? <AdminErrorAlert error={mutation.error} /> : null}
            </FieldGroup>
          </form>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <DialogActionButton
              action="cancel"
              type="button"
              variant="outline"
              disabled={mutation.isPending}
            >
              {tx("取消")}
            </DialogActionButton>
          </ResponsiveDialogClose>
          <DialogActionButton
            type="submit"
            form="key-editor-form"
            disabled={mutation.isPending || visibleScopes.length === 0}
            loading={mutation.isPending}
            loadingText={tx("保存中…")}
          >
            {tx("保存")}
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
