"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { BrandMark } from "@/components/brand-mark"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardBrowsingIcon,
  SparklesIcon,
  ApiIcon,
  ComputerTerminalIcon,
  CodeSquareIcon,
  MagicWand01Icon,
  BookOpen02Icon,
  Settings05Icon,
  Search01Icon,
  CustomerSupportIcon,
} from "@hugeicons/core-free-icons"

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const NAV_MAIN: NavItem[] = [
  { title: "Overview",  url: "/dashboard",         icon: DashboardBrowsingIcon },
  { title: "Agent",     url: "/dashboard/agent",   icon: SparklesIcon },
  { title: "API",       url: "/dashboard/api",     icon: ApiIcon },
  { title: "CLI",       url: "/dashboard/cli",     icon: ComputerTerminalIcon },
  { title: "SDK",       url: "/dashboard/sdk",     icon: CodeSquareIcon },
  { title: "Skills",    url: "/dashboard/skills",  icon: MagicWand01Icon },
]

const NAV_SECONDARY: NavItem[] = [
  { title: "Support",  url: "/dashboard/support", icon: CustomerSupportIcon },
  { title: "Docs",     url: "/dashboard/docs",    icon: BookOpen02Icon },
  { title: "Settings", url: "/dashboard/account", icon: Settings05Icon },
]

function FlatNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    pathname === item.url ||
    (item.url !== "/dashboard" && pathname?.startsWith(item.url))

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={isActive}
        render={<Link href={item.url} />}
        className="gap-2.5 py-1.5"
      >
        <HugeiconsIcon icon={item.icon} strokeWidth={1.75} className="size-[18px] shrink-0" />
        <span className="text-sm">{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>

      {/* Header: logo + trigger */}
      <SidebarHeader className="px-2 py-2">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="group-data-[collapsible=icon]:hidden flex items-center gap-2 px-1">
            <BrandMark size={18} />
            <span className="truncate text-sm font-semibold">getdesign</span>
          </Link>
          <SidebarTrigger className="size-8 group-data-[collapsible=icon]:mx-auto [&_svg]:size-[18px]" />
        </div>

        {/* Search */}
        <button className="group-data-[collapsible=icon]:hidden mt-1 flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent/70 transition-colors">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={1.75} className="size-4 shrink-0" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="font-mono text-xs opacity-60">⌘K</kbd>
        </button>
      </SidebarHeader>

      {/* Main nav */}
      <SidebarContent className="px-2">
        <SidebarMenu>
          {NAV_MAIN.map((item) => (
            <FlatNavItem key={item.title} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>

        <SidebarSeparator className="my-2" />

        <SidebarMenu>
          {NAV_SECONDARY.map((item) => (
            <FlatNavItem key={item.title} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer: user */}
      <SidebarFooter className="px-2 pb-3">
        <NavUser user={user} />
      </SidebarFooter>

    </Sidebar>
  )
}
