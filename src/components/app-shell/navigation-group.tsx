import { ChevronRightIcon } from "lucide-react"

import { Link } from "react-router"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { type NavigationGroup, type NavigationItem } from "./navigation"
export function NavigationGroupSection({
  activeItem,
  group,
}: {
  activeItem: NavigationItem | null
  group: NavigationGroup
}) {
  const { isMobile, setOpenMobile } = useSidebar()
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
                  className="h-10 md:h-8"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false)
                  }}
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
