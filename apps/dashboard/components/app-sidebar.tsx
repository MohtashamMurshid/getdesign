"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { BrandMark } from "@/components/brand-mark"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
} from "@hugeicons/core-free-icons"

type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
  items?: { title: string; url: string }[]
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: <HugeiconsIcon icon={DashboardBrowsingIcon} strokeWidth={2} />,
  },
  {
    title: "Agent",
    url: "/dashboard/agent",
    icon: <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />,
  },
  {
    title: "API",
    url: "/dashboard/api",
    icon: <HugeiconsIcon icon={ApiIcon} strokeWidth={2} />,
    items: [
      { title: "Keys", url: "/dashboard/api/keys" },
      { title: "Usage", url: "/dashboard/api/usage" },
      { title: "Webhooks", url: "/dashboard/api/webhooks" },
    ],
  },
  {
    title: "CLI",
    url: "/dashboard/cli",
    icon: <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />,
  },
  {
    title: "SDK",
    url: "/dashboard/sdk",
    icon: <HugeiconsIcon icon={CodeSquareIcon} strokeWidth={2} />,
  },
  {
    title: "Skills",
    url: "/dashboard/skills",
    icon: <HugeiconsIcon icon={MagicWand01Icon} strokeWidth={2} />,
  },
  {
    title: "Docs",
    url: "/dashboard/docs",
    icon: <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />,
  },
  {
    title: "Settings",
    url: "/dashboard/account",
    icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
    items: [
      { title: "Account", url: "/dashboard/account" },
      { title: "Team", url: "/dashboard/team" },
      { title: "Billing", url: "/dashboard/billing" },
    ],
  },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  const items = NAV_ITEMS.map((item) => ({
    ...item,
    isActive:
      pathname === item.url ||
      (item.url !== "/dashboard" && pathname?.startsWith(item.url)) ||
      item.items?.some((sub) => pathname?.startsWith(sub.url)) ||
      false,
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="getdesign"
              render={<Link href="/dashboard" />}
            >
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground">
                <BrandMark size={22} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">getdesign</span>
                <span className="truncate text-xs text-muted-foreground">
                  Dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
