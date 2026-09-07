import { queryOptions } from "@tanstack/react-query"
import { rootRequest } from "@/lib/request"
export type AuthPermissionRoute = {
  id: string
  parent_id: string | null
  name: string
  path: string
  hidden: boolean
  menu_type: "M" | "C"
  meta: { title: string; icon: string }
  children?: AuthPermissionRoute[]
}
export type AuthPermissions = {
  user_id: string
  super_admin: boolean
  permissions: string[]
  roles: string[]
  buttons: string[]
  routes: AuthPermissionRoute[]
}
const legacyPaths: Record<string, string> = {
  "/files": "/dashboard/files",
  "/uploads": "/dashboard/uploads",
  "/keys": "/dashboard/keys",
  "/storage": "/dashboard/storage",
  "/admin/users": "/dashboard/admin?section=users",
  "/admin/roles": "/dashboard/admin?section=roles",
  "/admin/permissions": "/dashboard/admin?section=permissions",
  "/admin/login-logs": "/dashboard/admin?section=login-events",
  "/admin/operation-logs": "/dashboard/admin?section=operation-logs",
}
function normalizeRoute(route: AuthPermissionRoute): AuthPermissionRoute {
  return {
    ...route,
    path: legacyPaths[route.path] || route.path,
    children: route.children?.map(normalizeRoute),
  }
}
// Older servers return these pages at the root; preserve server-authored trees.
export function groupDashboardRoutes(
  routes: AuthPermissionRoute[],
): AuthPermissionRoute[] {
  const groups = [
    {
      id: "system-management",
      title: "系统管理",
      sections: ["users", "roles", "permissions"],
    },
    {
      id: "system-logs",
      title: "系统日志",
      sections: ["login-events", "operation-logs"],
    },
  ]
  let result = routes.map(normalizeRoute)
  for (const group of groups) {
    const paths = group.sections.map(
      (section) => `/dashboard/admin?section=${section}`,
    )
    const children = result.filter(
      (route) => route.menu_type === "C" && paths.includes(route.path),
    )
    if (!children.length) continue
    const first = result.indexOf(children[0])
    const directory: AuthPermissionRoute = {
      id: group.id,
      parent_id: null,
      name: group.id,
      path: "",
      hidden: false,
      menu_type: "M",
      meta: { title: group.title, icon: "#" },
      children: children.map((route) => ({ ...route, parent_id: group.id })),
    }
    result = result.flatMap((route, index) =>
      index === first ? [directory] : children.includes(route) ? [] : [route],
    )
  }
  return result
}
export const authPermissionsQuery = queryOptions({
  queryKey: ["auth", "permissions"] as const,
  staleTime: 0,
  refetchInterval: 30_000,
  retry: false,
  queryFn: async () => {
    const result = await rootRequest<AuthPermissions>(
      "/api/account/permissions",
      { cache: "no-store" },
    )
    const route = (
      id: string,
      title: string,
      path: string,
    ): AuthPermissionRoute => ({
      id,
      parent_id: null,
      name: id,
      path,
      hidden: false,
      menu_type: "C",
      meta: { title, icon: "#" },
    })
    return {
      ...result,
      routes: [
        route("home", "仪表盘", "/dashboard"),
        ...groupDashboardRoutes(result.routes),
      ],
    }
  },
})
