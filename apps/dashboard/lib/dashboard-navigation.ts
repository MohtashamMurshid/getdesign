import type { IconSvgElement } from "@hugeicons/react"
import {
  DashboardBrowsingIcon,
  SparklesIcon,
  ApiIcon,
  ComputerTerminalIcon,
  CodeSquareIcon,
  MagicWand01Icon,
  BookOpen02Icon,
  Settings05Icon,
  CustomerSupportIcon,
} from "@hugeicons/core-free-icons"

export type NavItem = {
  title: string
  url: string
  icon: IconSvgElement
  keywords?: string
}

export const NAV_MAIN: NavItem[] = [
  {
    title: "Overview",
    url: "/",
    icon: DashboardBrowsingIcon,
    keywords: "home dashboard",
  },
  { title: "Agent", url: "/agent", icon: SparklesIcon },
  { title: "API", url: "/api", icon: ApiIcon },
  {
    title: "CLI",
    url: "/cli",
    icon: ComputerTerminalIcon,
    keywords: "terminal command line",
  },
  { title: "SDK", url: "/sdk", icon: CodeSquareIcon, keywords: "typescript" },
  { title: "Skills", url: "/skills", icon: MagicWand01Icon },
]

export const NAV_SECONDARY: NavItem[] = [
  {
    title: "Support",
    url: "/support",
    icon: CustomerSupportIcon,
    keywords: "help",
  },
  {
    title: "Docs",
    url: "/docs",
    icon: BookOpen02Icon,
    keywords: "documentation",
  },
  {
    title: "Settings",
    url: "/account",
    icon: Settings05Icon,
    keywords: "account provider keys",
  },
]

export const NAV_COMMANDS = [...NAV_MAIN, ...NAV_SECONDARY]

export function matchesNavigation(item: NavItem, query: string) {
  const text = `${item.title} ${item.url} ${item.keywords ?? ""}`.toLowerCase()
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every((word) => text.includes(word))
}
