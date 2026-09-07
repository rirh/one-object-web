import {
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleUserRoundIcon,
  ClipboardListIcon,
  Code2Icon,
  DatabaseIcon,
  FilesIcon,
  UploadIcon,
  EllipsisVerticalIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LogInIcon,
  LogOutIcon,
  UsersRoundIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import {
  type CSSProperties,
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router"
import { toast } from "sonner"

import { DashboardPageTransition } from "@/components/dashboard-route-motion"
import { LanguageToggle } from "@/components/language-toggle"
import { useTranslation } from "@/components/providers/language-context"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { DialogActionButton } from "@/components/ui/dialog-action-button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { getDefaultUserAvatarSeed } from "@/lib/default-user-avatar"
import { cn } from "@/lib/utils"
import {
  accountQueryKeys,
  authUserQuery,
  logout,
  type AuthUser,
} from "@/views/account/api"
import {
  authPermissionsQuery,
  type AuthPermissionRoute,
  type AuthPermissions,
} from "@/views/account/permissions-api"
import { findMenuIconOption } from "@/views/dashboard/menu-icons"
import { adminQueryKeys } from "@/views/dashboard/query-keys"

const DefaultUserAvatar = lazy(async () => {
  const module = await import("@/components/default-user-avatar")
  return { default: module.DefaultUserAvatar }
})

type NavigationItem = {
  href: string
  icon: LucideIcon
  id: string
  label: string
}

type NavigationGroup = {
  id: string
  label?: string
  items: ReadonlyArray<NavigationItem>
}

const localNavigation: Record<string, { icon: LucideIcon; id: string }> = {
  "/dashboard": { icon: LayoutDashboardIcon, id: "home" },
  "/dashboard/files": { icon: FilesIcon, id: "files" },
  "/dashboard/uploads": { icon: UploadIcon, id: "uploads" },
  "/dashboard/keys": { icon: KeyRoundIcon, id: "keys" },
  "/dashboard/storage": { icon: DatabaseIcon, id: "storage" },
  "/dashboard/integration": { icon: Code2Icon, id: "integration" },
  "/dashboard/admin?section=users": { icon: UsersRoundIcon, id: "admin-users" },
  "/dashboard/admin?section=roles": {
    icon: CircleUserRoundIcon,
    id: "admin-roles",
  },
  "/dashboard/admin?section=permissions": {
    icon: KeyRoundIcon,
    id: "admin-permissions",
  },
  "/dashboard/admin?section=login-events": {
    icon: LogInIcon,
    id: "admin-login-events",
  },
  "/dashboard/admin?section=operation-logs": {
    icon: ClipboardListIcon,
    id: "admin-operation-logs",
  },
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const user = useQuery(authUserQuery)
  const access = useQuery(authPermissionsQuery)
  const navigationGroups = useMemo(
    () => buildNavigationGroups(access.data),
    [access.data],
  )
  const navigation = useMemo(
    () => navigationGroups.flatMap((group) => group.items),
    [navigationGroups],
  )
  const activeNavigation = getActiveNavigation(
    navigation,
    location.pathname,
    location.search,
  )
  const [visitedIds, setVisitedIds] = useState<ReadonlyArray<string>>(() =>
    activeNavigation && activeNavigation.id !== "home"
      ? ["home", activeNavigation.id]
      : ["home"],
  )
  const routeKey = `${location.pathname}${location.search}`
  const isFullBleedResourcePage =
    location.pathname === "/dashboard" ||
    location.pathname === "/dashboard/admin"
  useEffect(() => {
    if (!activeNavigation) {
      return
    }

    // Route changes are the external state this tab list mirrors.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisitedIds((current) =>
      current.includes(activeNavigation.id)
        ? current
        : [...current, activeNavigation.id],
    )
  }, [activeNavigation])

  useEffect(() => {
    if (user.isSuccess && user.data === null) {
      queryClient.removeQueries({ queryKey: authPermissionsQuery.queryKey })
      queryClient.removeQueries({ queryKey: ["object-admin"] })
      queryClient.removeQueries({ queryKey: ["developer"] })
      queryClient.removeQueries({ queryKey: ["account"] })
    }
  }, [queryClient, user.data, user.isSuccess])

  function closeVisitedItem(item: NavigationItem) {
    if (item.id === "home") {
      return
    }

    const closingIndex = visitedIds.indexOf(item.id)
    const nextVisitedIds = visitedIds.filter((id) => id !== item.id)
    setVisitedIds(nextVisitedIds)

    if (activeNavigation?.id === item.id) {
      const fallbackId =
        nextVisitedIds[closingIndex - 1] ??
        nextVisitedIds[closingIndex] ??
        "home"
      const fallback = navigation.find(({ id }) => id === fallbackId)
      navigate(fallback?.href ?? "/dashboard")
    }
  }

  const visitedItems = visitedIds
    .map((id) => navigation.find((item) => item.id === id))
    .filter((item): item is NavigationItem => item !== undefined)

  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "34px",
        } as CSSProperties
      }
    >
      <Sidebar collapsible="offcanvas" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <Link to="/dashboard" aria-label={t("app.name")}>
                  <img
                    src="/one-object-logo.svg"
                    alt=""
                    aria-hidden="true"
                    className="size-6 rounded-md object-contain"
                  />
                  <span className="text-base font-semibold">
                    {t("app.name")}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {navigationGroups.map((group) => (
            <NavigationGroupSection
              activeItem={activeNavigation}
              group={group}
              key={group.id}
            />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SessionIdentity session={user} />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="h-svh min-h-0 overflow-hidden md:h-[calc(100svh-1rem)]">
        <header className="flex h-(--header-height) shrink-0 items-center overflow-visible border-b bg-muted transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
          <div className="flex h-full w-full min-w-0 items-center overflow-visible px-3 lg:px-4">
            <SidebarTrigger className="mr-2 -ml-1" />
            <div
              className="h-full w-px shrink-0 bg-border"
              aria-hidden="true"
            />
            <RouteTags
              activeItem={activeNavigation}
              items={visitedItems}
              onClose={closeVisitedItem}
              onSelect={(item) => navigate(item.href)}
            />
            <div className="ml-2 flex h-full shrink-0 items-center gap-1.5 overflow-visible">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="@container/main flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          <DashboardPageTransition routeKey={routeKey}>
            <div
              className={cn(
                "w-full",
                isFullBleedResourcePage
                  ? "flex min-h-0 flex-1 flex-col"
                  : "p-4 lg:p-5",
              )}
            >
              <Outlet />
            </div>
          </DashboardPageTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function NavigationGroupSection({
  activeItem,
  group,
}: {
  activeItem: NavigationItem | null
  group: NavigationGroup
}) {
  const groupLabel = group.label
  const items = (
    <SidebarGroupContent>
      <SidebarMenu>
        {group.items.map((item) => {
          const Icon = item.icon
          const isActive = activeItem?.id === item.id
          const label = item.label

          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  to={item.href}
                >
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroupContent>
  )

  if (!groupLabel) {
    return <SidebarGroup className="py-1">{items}</SidebarGroup>
  }

  return (
    <Collapsible className="group/collapsible" defaultOpen>
      <SidebarGroup className="py-1">
        <SidebarGroupLabel asChild className="h-7">
          <CollapsibleTrigger className="w-full cursor-pointer justify-between gap-2 text-left">
            <span className="min-w-0 flex-1 truncate text-left">
              {groupLabel}
            </span>
            <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>{items}</CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function RouteTags({
  activeItem,
  items,
  onClose,
  onSelect,
}: {
  activeItem: NavigationItem | null
  items: ReadonlyArray<NavigationItem>
  onClose: (item: NavigationItem) => void
  onSelect: (item: NavigationItem) => void
}) {
  const { locale } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isFirstItemActive = items[0]?.id === activeItem?.id

  useEffect(() => {
    const activeElement = scrollRef.current?.querySelector<HTMLElement>(
      '[data-active-tag="true"]',
    )
    activeElement?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [activeItem?.id, items])

  useLayoutEffect(() => {
    const root = rootRef.current
    const scroll = scrollRef.current
    if (!root || !scroll) {
      return
    }

    let animationFrame = 0
    const updateOverflow = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        root.dataset.overflow =
          scroll.scrollWidth > scroll.clientWidth + 1 ? "true" : "false"
      })
    }

    updateOverflow()
    window.addEventListener("resize", updateOverflow)
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateOverflow)
    resizeObserver?.observe(scroll)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", updateOverflow)
      resizeObserver?.disconnect()
    }
  }, [items])

  function scrollBy(offset: number) {
    scrollRef.current?.scrollBy({ left: offset, behavior: "smooth" })
  }

  return (
    <div ref={rootRef} className="tags-view-chrome">
      <button
        type="button"
        className="tags-view-chrome__nav tags-view-chrome__nav--left"
        aria-label={locale === "zh-CN" ? "向左滚动" : "Scroll left"}
        onClick={() => scrollBy(-240)}
      >
        <ChevronLeftIcon />
      </button>
      <div ref={scrollRef} className="tags-view-chrome__wrapper">
        <div
          className={cn(
            "tags-view-chrome__list",
            isFirstItemActive && "is-first-active",
          )}
        >
          {items.map((item, index) => {
            const Icon = item.icon
            const active = activeItem?.id === item.id
            const closable = item.id !== "home"
            const label = item.label
            const previousItem = items[index - 1]
            const separated =
              index > 0 && !active && previousItem?.id !== activeItem?.id

            return (
              <div
                className={cn(
                  "tags-view-chrome__item",
                  active && "active",
                  closable && "is-closable",
                  separated && "is-separated",
                )}
                data-active-tag={active}
                key={item.id}
              >
                <button
                  aria-current={active ? "page" : undefined}
                  className="tags-view-chrome__label"
                  onClick={() => onSelect(item)}
                  type="button"
                >
                  <span className="tags-view-chrome__icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span>{label}</span>
                </button>
                {closable ? (
                  <button
                    aria-label={
                      locale === "zh-CN" ? `关闭${label}` : `Close ${label}`
                    }
                    className="tags-view-chrome__close"
                    onClick={() => onClose(item)}
                    tabIndex={-1}
                    type="button"
                  >
                    <XIcon aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
      <button
        type="button"
        className="tags-view-chrome__nav tags-view-chrome__nav--right"
        aria-label={locale === "zh-CN" ? "向右滚动" : "Scroll right"}
        onClick={() => scrollBy(240)}
      >
        <ChevronRightIcon />
      </button>
    </div>
  )
}

type SessionQuery = UseQueryResult<AuthUser | null, Error>

function SessionIdentity({ session }: { session: SessionQuery }) {
  const { isMobile } = useSidebar()
  const { locale, t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const user = session.data
  const displayName = user?.display_name ?? t("session.signedOut")
  const secondaryText = user?.email?.trim()
  const avatarSeed = getDefaultUserAvatarSeed(
    user?.user_id,
    user?.email,
    user?.user_name,
    user?.display_name,
  )
  const logoutMutation = useMutation({
    mutationFn: logout,
    onError: (error) =>
      toast.error(t("account.logoutError"), {
        description: error.message,
      }),
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: authUserQuery.queryKey })
      queryClient.clear()
      queryClient.setQueryData(authUserQuery.queryKey, null)
      queryClient.removeQueries({ queryKey: authPermissionsQuery.queryKey })
      queryClient.removeQueries({ queryKey: accountQueryKeys.root })
      queryClient.removeQueries({ queryKey: adminQueryKeys.root })
      queryClient.removeQueries({ queryKey: ["developer"] })
      setLogoutDialogOpen(false)
      navigate("/login", { replace: true })
    },
  })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground"
              >
                {user ? (
                  <Suspense fallback={null}>
                    <DefaultUserAvatar seed={avatarSeed} />
                  </Suspense>
                ) : session.isPending ? (
                  "…"
                ) : (
                  "!"
                )}
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5 text-left leading-none">
                <span className="truncate text-sm font-medium">
                  {displayName}
                </span>
                {secondaryText ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {secondaryText}
                  </span>
                ) : null}
              </span>
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-64"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <span className="grid min-w-0 gap-1">
                <span className="truncate text-sm font-medium">
                  {displayName}
                </span>
                {secondaryText ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {secondaryText}
                  </span>
                ) : null}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user ? (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/account">
                    <CircleUserRoundIcon />
                    {t("nav.account")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={logoutMutation.isPending}
                  onSelect={() => setLogoutDialogOpen(true)}
                  variant="destructive"
                >
                  <LogOutIcon />
                  {t("account.logout")}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link to="/login">
                  <LogInIcon />
                  {t("nav.login")}
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <ResponsiveDialog
          open={logoutDialogOpen}
          onOpenChange={(open) => {
            if (!logoutMutation.isPending) setLogoutDialogOpen(open)
          }}
        >
          <ResponsiveDialogContent className="sm:max-w-[25rem]">
            <ResponsiveDialogHeader className="px-5 py-4 pr-12">
              <ResponsiveDialogTitle>
                {locale === "zh-CN" ? "退出登录" : "Sign out"}
              </ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody className="px-5 py-4">
              <ResponsiveDialogDescription className="leading-6">
                {locale === "zh-CN"
                  ? "确认退出当前账号吗？"
                  : "Are you sure you want to sign out of the current account?"}
              </ResponsiveDialogDescription>
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter className="gap-2 px-5 py-3">
              <ResponsiveDialogClose asChild>
                <DialogActionButton
                  action="cancel"
                  className="min-w-20"
                  disabled={logoutMutation.isPending}
                  type="button"
                  variant="outline"
                >
                  {locale === "zh-CN" ? "取消" : "Cancel"}
                </DialogActionButton>
              </ResponsiveDialogClose>
              <DialogActionButton
                aria-busy={logoutMutation.isPending}
                className="min-w-24"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
                type="button"
                variant="destructive"
              >
                {logoutMutation.isPending
                  ? locale === "zh-CN"
                    ? "退出中..."
                    : "Signing out..."
                  : t("account.logout")}
              </DialogActionButton>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function buildNavigationGroups(
  access: AuthPermissions | undefined,
): NavigationGroup[] {
  const seenItems = new Set<string>()

  return (access?.routes ?? []).flatMap((route) => {
    const items = navigationItems(route, seenItems)
    if (items.length === 0) return []

    return [
      {
        id: route.id,
        ...(route.menu_type === "M" ? { label: route.meta.title } : {}),
        items,
      },
    ]
  })
}

function navigationItems(
  route: AuthPermissionRoute,
  seenItems: Set<string>,
): NavigationItem[] {
  const items: NavigationItem[] = []
  const local = localNavigation[route.path]
  if (
    route.menu_type === "C" &&
    !route.hidden &&
    local &&
    !seenItems.has(local.id)
  ) {
    seenItems.add(local.id)
    items.push({
      href: route.path,
      icon:
        (route.meta.icon !== "#"
          ? findMenuIconOption(route.meta.icon)?.Icon
          : undefined) ?? local.icon,
      id: local.id,
      label: route.meta.title,
    })
  }

  route.children?.forEach((child) => {
    items.push(...navigationItems(child, seenItems))
  })
  return items
}

function getActiveNavigation(
  navigation: ReadonlyArray<NavigationItem>,
  pathname: string,
  search: string,
) {
  if (pathname === "/dashboard/admin") {
    const section = new URLSearchParams(search).get("section") ?? "users"
    return (
      navigation.find(
        (item) => item.href === `/dashboard/admin?section=${section}`,
      ) ??
      navigation.find((item) => item.id === "admin-users") ??
      null
    )
  }

  return (
    navigation.find(
      (item) => new URL(item.href, "https://one.invalid").pathname === pathname,
    ) ?? null
  )
}
