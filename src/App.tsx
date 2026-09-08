import { useObjectTranslation } from "@/local/object"
import { RouteProgressPending } from "@/components/route-progress"
import { lazy, Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { Navigate, Outlet, Route, Routes } from "react-router"
const AppShell = lazy(async () => ({
  default: (await import("@/components/app-shell")).AppShell,
}))
import { Loading, Failure } from "@/components/async-state"
import { LoginPage } from "@/views/login"
import { authUserQuery } from "@/views/dashboard/account/api"
import { authPermissionsQuery } from "@/views/dashboard/account/permissions-api"
const Dashboard = lazy(() => import("@/views/dashboard"))
const Admin = lazy(() => import("@/views/dashboard/admin"))
const Account = lazy(() => import("@/views/dashboard/account"))
const Files = lazy(() => import("@/views/dashboard/files"))
const Keys = lazy(() => import("@/views/dashboard/keys"))
const Buckets = lazy(() => import("@/views/dashboard/buckets"))
const Storage = lazy(() => import("@/views/dashboard/storage"))
const Integration = lazy(() => import("@/views/dashboard/integration"))
function RequirePermission({ code }: { code: string }) {
  const tx = useObjectTranslation()

  const access = useQuery(authPermissionsQuery)
  if (access.isPending) return <Loading />
  if (access.error) return <Failure error={access.error} />
  return access.data?.permissions.includes(code) ? (
    <Outlet />
  ) : (
    <Failure error={new Error(tx("没有此页面的访问权限"))} />
  )
}
export function App() {
  const account = useQuery(authUserQuery)
  if (account.isPending)
    return (
      <main className="p-8">
        <Loading />
      </main>
    )
  if (account.error)
    return (
      <main className="mx-auto max-w-xl p-8">
        <Failure error={account.error} retry={() => void account.refetch()} />
      </main>
    )
  if (!account.data) return <LoginPage />
  return (
    <Suspense
      fallback={
        <>
          <RouteProgressPending />
          <Loading />
        </>
      }
    >
      <Routes>
        <Route path="dashboard" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="admin" element={<Admin />} />
          <Route path="account" element={<Account />} />
          <Route element={<RequirePermission code="object:files:read" />}>
            <Route path="files">
              <Route index element={<Files />} />
              <Route path=":id/*" element={<Files />} />
            </Route>
          </Route>
          <Route element={<RequirePermission code="object:uploads:write" />}>
            <Route
              path="uploads"
              element={<Navigate replace to="/dashboard/files?upload=1" />}
            />
          </Route>
          <Route element={<RequirePermission code="object:keys:list" />}>
            <Route path="keys" element={<Keys />} />
          </Route>
          <Route element={<RequirePermission code="object:storage:read" />}>
            <Route path="storage" element={<Storage />} />
          </Route>
          <Route element={<RequirePermission code="object:bucket:read" />}>
            <Route path="buckets">
              <Route index element={<Buckets />} />
              <Route path=":id" element={<Buckets />} />
            </Route>
          </Route>
          <Route path="integration" element={<Integration />} />
        </Route>
        {["files", "uploads", "keys", "storage", "buckets", "integration"].map(
          (path) => (
            <Route
              key={path}
              path={path}
              element={<Navigate replace to={`/dashboard/${path}`} />}
            />
          ),
        )}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
