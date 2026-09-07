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
import { authPermissionsQuery } from "@/views/account/permissions-api"
import { formatAdminTime } from "../shared/format"
type User = {
  user_id: string
  oidc_sub: string
  display_name: string
  status: "active" | "disabled" | "deleted"
  role_ids: string[]
  created_at: string
}
type UserPage = { items: User[]; total: number; limit: number }
type Editor = { kind: "create" | "edit" | "roles" | "delete"; user?: User }
export function UsersPanel({ permissions }: { permissions: string[] }) {
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
  const data = useMemo(
    () =>
      users.data?.pages
        .flatMap((p) => p.items)
        .filter(
          (u) =>
            (status === "all" || status === u.status) &&
            `${u.display_name} ${u.oidc_sub}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        ) || [],
    [users.data, search, status],
  )
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "display_name",
        header: "用户",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.display_name}</div>
        ),
      },
      { accessorKey: "oidc_sub", header: "One User 账号标识" },
      {
        accessorKey: "status",
        header: "状态",
        cell: ({ getValue }) => (
          <Badge variant={getValue() === "active" ? "secondary" : "outline"}>
            {getValue() === "active"
              ? "启用"
              : getValue() === "disabled"
                ? "停用"
                : "已删除"}
          </Badge>
        ),
      },
      {
        accessorKey: "created_at",
        header: "创建时间",
        cell: ({ getValue }) => formatAdminTime(getValue<string>()),
      },
    ],
    [],
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
          { value: "all", label: "全部" },
          { value: "active", label: "启用" },
          { value: "disabled", label: "停用" },
          { value: "deleted", label: "已删除" },
        ]}
        searchPlaceholder="搜索已加载用户"
        isLoading={users.isPending}
        isFetching={users.isFetching}
        error={users.error}
        onRefresh={() => void users.refetch()}
        onCreate={
          permissions.includes("object:user:create")
            ? () => setEditor({ kind: "create" })
            : undefined
        }
        createLabel="新增用户"
        emptyLabel="暂无用户"
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
                  编辑
                </Button>
              )}
              {permissions.includes("object:user:assign") &&
                permissions.includes("object:role:list") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditor({ kind: "roles", user })}
                  >
                    角色
                  </Button>
                )}
              {permissions.includes("object:user:delete") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditor({ kind: "delete", user })}
                >
                  删除
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
            加载更多用户
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
    create: "新增用户",
    edit: "编辑用户",
    roles: "分配角色",
    delete: "删除用户",
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
                ? "绑定已有 One User 账号，创建后再分配角色。"
                : editor.kind === "delete"
                  ? "删除后禁止访问，已上传文件和操作记录保留。"
                  : editor.user?.display_name}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="space-y-4">
            {mutation.error && <AdminErrorAlert error={mutation.error} />}
            {editor.kind === "create" && (
              <Field>
                <FieldLabel htmlFor="oidc-sub">One User 账号标识</FieldLabel>
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
                <FieldLabel htmlFor="display-name">显示名称</FieldLabel>
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
                <FieldLabel>状态</FieldLabel>
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
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="disabled">停用</SelectItem>
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
                      {role.status !== "active" && "（已停用）"}
                    </label>
                  ))}
                </div>
              </>
            )}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <Button variant="outline" disabled={mutation.isPending}>
                取消
              </Button>
            </ResponsiveDialogClose>
            <DialogActionButton
              type="submit"
              disabled={
                mutation.isPending ||
                (editor.kind === "roles" && (roles.isPending || roles.isError))
              }
              variant={editor.kind === "delete" ? "destructive" : "default"}
            >
              {mutation.isPending ? "保存中…" : "确认"}
            </DialogActionButton>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
