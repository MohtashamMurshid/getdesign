"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { BrandMark } from "@/components/brand-mark"
import { NavUser } from "@/components/nav-user"
import { DashboardCommandMenu } from "@/components/dashboard-command-menu"
import {
  NAV_MAIN,
  NAV_SECONDARY,
  type NavItem,
} from "@/lib/dashboard-navigation"
import { isApplePlatform } from "@/lib/navigation-shortcuts"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

const subscribePlatform = () => () => {}

function FlatNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    pathname === item.url ||
    (item.url !== "/" && pathname?.startsWith(item.url))

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={isActive}
        render={<Link href={item.url} />}
        className="gap-2.5 py-1.5"
      >
        <HugeiconsIcon
          icon={item.icon}
          strokeWidth={1.75}
          className="size-[18px] shrink-0"
        />
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
  const [commandOpen, setCommandOpen] = React.useState(false)
  const returnFocusRef = React.useRef<HTMLElement | null>(null)
  const { setOpenMobile } = useSidebar()
  const isMac = React.useSyncExternalStore(
    subscribePlatform,
    () => isApplePlatform(navigator.platform),
    () => true
  )
  const changeCommandOpen = React.useCallback(
    (open: boolean) => {
      if (open) {
        returnFocusRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null
        setOpenMobile(false)
      }
      setCommandOpen(open)
    },
    [setOpenMobile]
  )

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        {/* Header: logo + trigger */}
        <SidebarHeader className="px-2 py-2">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:hidden"
            >
              <BrandMark size={18} />
              <span className="truncate text-sm font-semibold">getdesign</span>
            </Link>
            <SidebarTrigger className="size-8 group-data-[collapsible=icon]:mx-auto [&_svg]:size-[18px]" />
          </div>

          {/* Search */}
          <button
            type="button"
            aria-label="Search pages"
            aria-haspopup="dialog"
            aria-expanded={commandOpen}
            aria-keyshortcuts="Meta+K Control+K"
            onClick={() => changeCommandOpen(true)}
            className="mt-1 flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-sm text-sidebar-foreground/50 transition-colors group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
          >
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={1.75}
              className="size-4 shrink-0"
            />
            <span className="flex-1 text-left">Search</span>
            <kbd className="font-mono text-xs opacity-60">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
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
      <DashboardCommandMenu
        open={commandOpen}
        onOpenChange={changeCommandOpen}
        returnFocusRef={returnFocusRef}
      />
    </>
  )
}
