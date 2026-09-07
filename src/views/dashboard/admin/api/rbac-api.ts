import { rootRequest } from "@/lib/request"

export type IdentityRole = {
  role_id: string
  role_name: string
  role_key: string
  role_sort: number
  status: "active" | "disabled"
  description: string
  permission_ids: string[]
}

export type IdentityPermission = {
  permission_id: string
  permission_name: string
  permission_code: string | null
  parent_id: string | null
  order_num: number
  path: string
  permission_type: "M" | "C" | "F"
  visible: boolean
  status: "active" | "disabled"
  icon: string
  description: string
}

export type IdentityPermissionInput = Omit<IdentityPermission, "permission_id">

export const rbacQueryKeys = {
  permissions: ["object-admin", "permissions"] as const,
  roles: ["object-admin", "roles"] as const,
  userRoles: (userId: string) =>
    ["object-admin", "users", userId, "roles"] as const,
}

export async function listRoles() {
  return (
    await rootRequest<{ items: IdentityRole[] }>("/api/admin/roles", {
      cache: "no-store",
    })
  ).items
}
export async function listPermissions() {
  return (
    await rootRequest<{ items: IdentityPermission[] }>(
      "/api/admin/permissions",
      { cache: "no-store" },
    )
  ).items
}
export async function createPermission(input: IdentityPermissionInput) {
  const created = await rootRequest<{ permission_id: string }>(
    "/api/admin/permissions",
    { method: "POST", body: JSON.stringify(input) },
  )
  return (await listPermissions()).find(
    (p) => p.permission_id === created.permission_id,
  )!
}
export async function updatePermission(
  id: string,
  input: IdentityPermissionInput,
) {
  await rootRequest(`/api/admin/permissions/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
  return (await listPermissions()).find((p) => p.permission_id === id)!
}
export async function deletePermission(id: string) {
  await rootRequest(`/api/admin/permissions/${id}`, { method: "DELETE" })
}
export async function updatePermissionStatus(
  id: string,
  status: IdentityPermission["status"],
) {
  const permission = (await listPermissions()).find(
    (p) => p.permission_id === id,
  )
  if (!permission) throw new Error("权限不存在")
  const { permission_id: _, ...input } = permission
  return updatePermission(id, { ...input, status })
}
export async function reorderPermissions(
  parent_id: string | null,
  ids: string[],
) {
  await rootRequest("/api/admin/permissions/reorder", {
    method: "PUT",
    body: JSON.stringify({ parent_id, ids }),
  })
}
export async function createRole(input: {
  role_name: string
  role_key: string
  description: string
  permission_ids: string[]
}) {
  const created = await rootRequest<{ role_id: string }>("/api/admin/roles", {
    method: "POST",
    body: JSON.stringify({ ...input, role_sort: 100, status: "active" }),
  })
  return (await listRoles()).find((r) => r.role_id === created.role_id)!
}
export async function updateRole(role: IdentityRole) {
  const { role_id, permission_ids: _, ...input } = role
  await rootRequest(`/api/admin/roles/${role_id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
  return { ...role, ...input }
}
export async function deleteRole(id: string) {
  await rootRequest(`/api/admin/roles/${id}`, { method: "DELETE" })
}
export async function assignRolePermissions(id: string, ids: string[]) {
  await rootRequest(`/api/admin/roles/${id}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ ids }),
  })
}
export async function getUserRoles(id: string) {
  return rootRequest<{ user_id: string; role_ids: string[] }>(
    `/api/admin/users/${id}/roles`,
  )
}
export async function assignUserRoles(id: string, ids: string[]) {
  await rootRequest(`/api/admin/users/${id}/roles`, {
    method: "PUT",
    body: JSON.stringify({ ids }),
  })
}
