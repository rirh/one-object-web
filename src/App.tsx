import { LogoMark } from "@/components/logo-mark"
import { LoginPage } from "@/views/login"
import { lazy, Suspense } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router"
import {
  FilesIcon,
  UploadIcon,
  KeyRoundIcon,
  DatabaseIcon,
  CodeIcon,
  LogOutIcon,
} from "lucide-react"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Loading, Failure } from "@/components/async-state"
import { SweepShine } from "@/components/sweep-shine"
import { getUser, logout, type User } from "@/views/account/api"
const Files = lazy(() => import("@/views/files"))
const Uploads = lazy(() => import("@/views/uploads"))
const Keys = lazy(() => import("@/views/keys"))
const Storage = lazy(() => import("@/views/storage"))
const Integration = lazy(() => import("@/views/integration"))
const navigation = [
  { to: "/files", title: "文件管理", icon: FilesIcon },
  { to: "/uploads", title: "上传文件", icon: UploadIcon },
  { to: "/keys", title: "应用密钥", icon: KeyRoundIcon },
  { to: "/storage", title: "存储配置", icon: DatabaseIcon },
  { to: "/integration", title: "应用接入", icon: CodeIcon },
]
function Shell({ user }: { user: User }) {
  const location = useLocation()
  const client = useQueryClient()
  const { setOpenMobile } = useSidebar()
  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      client.clear()
      client.setQueryData(["account"], null)
    },
  })
  return (
    <>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <Link
            to="/files"
            className="flex items-center gap-2 px-2 py-3 font-semibold"
          >
            <LogoMark className="size-8" />
            One Object
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>对象存储</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.to}
                    >
                      <Link to={item.to} onClick={() => setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <p className="truncate px-2 text-sm" title={user.email || user.sub}>
            {user.name || user.email || "One User 用户"}
          </p>
          <Button
            variant="ghost"
            className="justify-start"
            disabled={signOut.isPending}
            aria-busy={signOut.isPending}
            onClick={() => signOut.mutate()}
          >
            <LogOutIcon data-icon="inline-start" />
            <SweepShine active={signOut.isPending}>退出登录</SweepShine>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground">
            One Object /{" "}
            {navigation.find((item) => item.to === location.pathname)?.title ||
              "文件管理"}
          </span>
        </header>
        <main className="mx-auto w-full max-w-7xl min-w-0 p-4 md:p-8">
          {signOut.error ? <Failure error={signOut.error} /> : null}
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </SidebarInset>
    </>
  )
}
export function App() {
  const account = useQuery({
    queryKey: ["account"],
    queryFn: ({ signal }) => getUser(signal),
    retry: false,
  })
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
    <SidebarProvider>
      <Routes>
        <Route element={<Shell user={account.data} />}>
          <Route path="/files" element={<Files />} />
          <Route path="/uploads" element={<Uploads />} />
          <Route path="/keys" element={<Keys />} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/integration" element={<Integration />} />
          <Route path="*" element={<Navigate to="/files" replace />} />
        </Route>
      </Routes>
    </SidebarProvider>
  )
}
