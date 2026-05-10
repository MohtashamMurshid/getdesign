"use client"

import * as React from "react"
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"

type NavItemType = {
  title: string
  url: string
  icon: React.ReactNode
  isActive?: boolean
  items?: { title: string; url: string }[]
}

function NavItem({ item }: { item: NavItemType }) {
  const [open, setOpen] = React.useState(item.isActive ?? false)

  // Auto-open when a child route becomes active, but never force-close
  React.useEffect(() => {
    if (item.isActive) setOpen(true)
  }, [item.isActive])

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      render={<SidebarMenuItem />}
    >
      <SidebarMenuButton
        tooltip={item.title}
        isActive={item.isActive}
        render={<Link href={item.url} />}
      >
        {item.icon}
        <span>{item.title}</span>
      </SidebarMenuButton>
      {item.items?.length ? (
        <>
          <CollapsibleTrigger
            render={
              <SidebarMenuAction className="aria-expanded:rotate-180" />
            }
          >
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
            <span className="sr-only">Toggle</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton render={<Link href={subItem.url} />}>
                    <span>{subItem.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </>
      ) : null}
    </Collapsible>
  )
}

export function NavMain({ items }: { items: NavItemType[] }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <NavItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
