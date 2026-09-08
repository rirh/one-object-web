import { useObjectTranslation } from "@/local/object"
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useMemo, useState, type FormEvent } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DefaultUserAvatar } from "@/components/default-user-avatar"
import { Badge } from "@/components/ui/badge"
import { DialogActionButton } from "@/components/ui/dialog-action-button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogClose,
} from "@/components/ui/responsive-dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { rootRequest } from "@/lib/request"
import { ResourceTable } from "../shared/resource-table"
import { AdminErrorAlert } from "../shared/common"
import { listRoles, rbacQueryKeys, assignUserRoles } from "../../api/rbac-api"
import { authPermissionsQuery } from "@/views/dashboard/account/permissions-api"
import { formatAdminTime } from "../shared/format"
type User = {
  user_id: string
  oidc_sub: string
  display_name: string
  avatar_url: string | null
  email: string | null
  status: "active" | "disabled" | "deleted"
  role_ids: string[]
  created_at: string
}
type UserPage = { items: User[]; total: number; limit: number }
type Editor = { kind: "create" | "edit" | "roles" | "delete"; user?: User }
export function UsersPanel({ permissions }: { permissions: string[] }) {
  const tx = useObjectTranslation()

  const client = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | User["status"]>("all")
  const [editor, setEditor] = useState<Editor | null>(null)
  const users = useInfiniteQuery({
    queryKey: ["object-admin", "users"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      rootRequest<UserPage>(`/api/admin/users?offset=${pageParam}`),
    getNextPageParam: (page, all) => {
      const n = all.reduce((sum, p) => sum + p.items.length, 0)
      return n < page.total ? n : undefined
    },
  })
  const roles = useQuery({
    queryKey: rbacQueryKeys.roles,
    queryFn: listRoles,
    enabled: permissions.includes("object:role:list"),
  })
  const roleNames = useMemo(
    () => new Map(roles.data?.map((role) => [role.role_id, role.role_name])),
    [roles.data],
  )
  const data = useMemo(
    () =>
      users.data?.pages
        .flatMap((p) => p.items)
        .filter(
          (u) =>
            (status === "all" || status === u.status) &&
            `${u.display_name} ${u.oidc_sub} ${u.email ?? ""}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        ) || [],
    [users.data, search, status],
  )
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "display_name",
        header: tx("用户"),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-9 shrink-0">
              <AvatarImage
                src={row.original.avatar_url || undefined}
                alt={row.original.display_name}
              />
              <AvatarFallback>
                <DefaultUserAvatar seed={row.original.oidc_sub} />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="max-w-64 truncate font-medium">
                {row.original.display_name &&
                row.original.display_name !== row.original.oidc_sub
                  ? row.original.display_name
                  : row.original.email ||
                    `${tx("用户")} #${row.original.oidc_sub}`}
              </div>
              <div
                className="max-w-72 truncate text-xs text-muted-foreground"
                title={[row.original.email, `ID: ${row.original.oidc_sub}`]
                  .filter(Boolean)
                  .join(" · ")}
              >
                {row.original.email &&
                  row.original.display_name !== row.original.oidc_sub &&
                  `${row.original.email} · `}
                ID: {row.original.oidc_sub}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role_ids",
        header: tx("角色"),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex max-w-72 flex-wrap gap-1">
            {row.original.role_ids.length ? (
              row.original.role_ids.map((id) => (
                <Badge key={id} variant="outline" className="max-w-full">
                  <span
                    className="truncate"
                    title={roleNames.get(id) || `#${id}`}
                  >
                    {roleNames.get(id) || `#${id}`}
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                {tx("未分配角色")}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: tx("状态"),
        cell: ({ getValue }) => (
          <Badge variant={getValue() === "active" ? "secondary" : "outline"}>
            {getValue() === "active"
              ? tx("启用")
              : getValue() === "disabled"
                ? tx("停用")
                : tx("已删除")}
          </Badge>
        ),
      },
      {
        accessorKey: "created_at",
        header: tx("创建时间"),
        cell: ({ getValue }) => formatAdminTime(getValue<string>()),
      },
    ],
    [tx, roleNames],
  )
  return (
    <>
      <ResourceTable
        data={data}
        columns={columns}
        searchValue={search}
        onSearchChange={setSearch}
        statusFilter={status}
        onStatusFilterChange={setStatus}
        statusFilterOptions={[
          { value: "all", label: tx("全部") },
          { value: "active", label: tx("启用") },
          { value: "disabled", label: tx("停用") },
          { value: "deleted", label: tx("已删除") },
        ]}
        searchPlaceholder={tx("搜索已加载用户")}
        isLoading={users.isPending}
        isFetching={users.isFetching}
        error={users.error}
        onRefresh={() => void users.refetch()}
        onCreate={
          permissions.includes("object:user:create")
            ? () => setEditor({ kind: "create" })
            : undefined
        }
        createLabel={tx("新增用户")}
        emptyLabel={tx("暂无用户")}
        getRowId={(u) => u.user_id}
        renderRowActions={(user) =>
          user.status !== "deleted" && (
            <div className="flex gap-1">
              {permissions.includes("object:user:update") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditor({ kind: "edit", user })}
                >
                  {tx("编辑")}
                </Button>
              )}
              {permissions.includes("object:user:assign") &&
                permissions.includes("object:role:list") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditor({ kind: "roles", user })}
                  >
                    {tx("角色")}
                  </Button>
                )}
              {permissions.includes("object:user:delete") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditor({ kind: "delete", user })}
                >
                  {tx("删除")}
                </Button>
              )}
            </div>
          )
        }
      />
      {users.hasNextPage && (
        <div className="flex justify-center p-4">
          <Button
            variant="outline"
            disabled={users.isFetchingNextPage}
            onClick={() => void users.fetchNextPage()}
          >
            {tx("加载更多用户")}
          </Button>
        </div>
      )}
      {editor && (
        <UserDialog
          key={`${editor.kind}-${editor.user?.user_id}`}
          editor={editor}
          close={() => setEditor(null)}
          saved={async () => {
            setEditor(null)
            await client.invalidateQueries({
              queryKey: ["object-admin", "users"],
            })
            await client.invalidateQueries({
              queryKey: authPermissionsQuery.queryKey,
            })
          }}
        />
      )}
    </>
  )
}
function UserDialog({
  editor,
  close,
  saved,
}: {
  editor: Editor
  close: () => void
  saved: () => Promise<void>
}) {
  const tx = useObjectTranslation()

  const [name, setName] = useState(editor.user?.display_name || "")
  const [sub, setSub] = useState("")
  const [status, setStatus] = useState(editor.user?.status || "active")
  const [selected, setSelected] = useState(editor.user?.role_ids || [])
  const roles = useQuery({
    queryKey: rbacQueryKeys.roles,
    queryFn: listRoles,
    enabled: editor.kind === "roles",
  })
  const mutation = useMutation({
    mutationFn: async () => {
      if (editor.kind === "create")
        return rootRequest("/api/admin/users", {
          method: "POST",
          body: JSON.stringify({ oidc_sub: sub, display_name: name }),
        })
      if (editor.kind === "roles")
        return assignUserRoles(editor.user!.user_id, selected)
      return rootRequest(`/api/admin/users/${editor.user!.user_id}`, {
        method: editor.kind === "delete" ? "DELETE" : "PUT",
        ...(editor.kind === "edit"
          ? { body: JSON.stringify({ display_name: name, status }) }
          : {}),
      })
    },
    onSuccess: saved,
  })
  const title = {
    create: tx("新增用户"),
    edit: tx("编辑用户"),
    roles: tx("分配角色"),
    delete: tx("删除用户"),
  }[editor.kind]
  function submit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }
  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) close()
      }}
    >
      <ResponsiveDialogContent>
        <form onSubmit={submit} className="flex min-h-0 flex-col">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {editor.kind === "create"
                ? tx("绑定已有 One User 账号，创建后再分配角色。")
                : editor.kind === "delete"
                  ? tx("删除后禁止访问，已上传文件和操作记录保留。")
                  : editor.user?.display_name}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="space-y-4">
            {mutation.error && <AdminErrorAlert error={mutation.error} />}
            {editor.kind === "create" && (
              <Field>
                <FieldLabel htmlFor="oidc-sub">
                  {tx("One User 账号标识")}
                </FieldLabel>
                <Input
                  id="oidc-sub"
                  required
                  maxLength={255}
                  value={sub}
                  onChange={(e) => setSub(e.target.value)}
                />
              </Field>
            )}
            {(editor.kind === "create" || editor.kind === "edit") && (
              <Field>
                <FieldLabel htmlFor="display-name">{tx("显示名称")}</FieldLabel>
                <Input
                  id="display-name"
                  required
                  maxLength={128}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            )}
            {editor.kind === "edit" && (
              <Field>
                <FieldLabel>{tx("状态")}</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as "active" | "disabled")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{tx("启用")}</SelectItem>
                    <SelectItem value="disabled">{tx("停用")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
            {editor.kind === "roles" && (
              <>
                {roles.error && <AdminErrorAlert error={roles.error} />}
                <div className="space-y-3">
                  {roles.data?.map((role) => (
                    <label
                      key={role.role_id}
                      className="flex items-center gap-3"
                    >
                      <Checkbox
                        disabled={role.status !== "active"}
                        checked={selected.includes(role.role_id)}
                        onCheckedChange={(checked) =>
                          setSelected((current) =>
                            checked
                              ? [...current, role.role_id]
                              : current.filter((id) => id !== role.role_id),
                          )
                        }
                      />
                      {role.role_name}
                      {role.status !== "active" && tx("（已停用）")}
                    </label>
                  ))}
                </div>
              </>
            )}
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
              disabled={
                mutation.isPending ||
                (editor.kind === "roles" && (roles.isPending || roles.isError))
              }
              variant={editor.kind === "delete" ? "destructive" : "default"}
            >
              {mutation.isPending ? tx("保存中…") : tx("确认")}
            </DialogActionButton>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
