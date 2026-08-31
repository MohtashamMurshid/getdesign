"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Autocomplete } from "@base-ui/react/autocomplete"
import { Dialog } from "@base-ui/react/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  NAV_COMMANDS,
  matchesNavigation,
  type NavItem,
} from "@/lib/dashboard-navigation"
import {
  hasOpenNavigationOverlay,
  isEditableTarget,
  isNavigationShortcut,
} from "@/lib/navigation-shortcuts"

export function DashboardCommandMenu({
  open,
  onOpenChange,
  returnFocusRef,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnFocusRef: React.RefObject<HTMLElement | null>
}) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isNavigationShortcut(event, "k")) return
      if (
        !open &&
        (isEditableTarget(event.target) || hasOpenNavigationOverlay())
      )
        return
      event.preventDefault()
      onOpenChange(!open)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  function navigate(item: NavItem) {
    onOpenChange(false)
    router.push(item.url)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 supports-backdrop-filter:backdrop-blur-xs" />
        <Dialog.Popup
          initialFocus={inputRef}
          finalFocus={() => {
            const previous = returnFocusRef.current
            if (previous?.isConnected && previous.getClientRects().length)
              return previous
            // A mobile Search button disappears when its sidebar sheet closes.
            return (
              Array.from(
                document.querySelectorAll<HTMLElement>(
                  '[data-sidebar="trigger"]'
                )
              ).find((element) => element.getClientRects().length > 0) ?? true
            )
          }}
          className="fixed top-[15vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg outline-none"
        >
          <Dialog.Title className="sr-only">Go to page</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search pages. Use the arrow keys to choose a page, Enter to open it,
            or Escape to close.
          </Dialog.Description>
          <Autocomplete.Root
            items={NAV_COMMANDS}
            inline
            open
            autoHighlight="always"
            loopFocus
            filter={matchesNavigation}
            itemToStringValue={(item) => item.title}
          >
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <HugeiconsIcon
                icon={Search01Icon}
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.75}
              />
              <Autocomplete.Input
                ref={inputRef}
                aria-label="Search pages"
                aria-expanded="true"
                placeholder="Search pages…"
                className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Dialog.Close
                render={<Button variant="ghost" size="icon-sm" />}
                aria-label="Close command menu"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  className="size-4"
                  strokeWidth={1.75}
                />
              </Dialog.Close>
            </div>
            <Autocomplete.Empty className="px-4 py-8 text-center text-sm text-muted-foreground empty:hidden">
              No pages found. Try another search.
            </Autocomplete.Empty>
            <Autocomplete.List
              aria-label="Pages"
              className="max-h-[min(24rem,55vh)] overflow-y-auto p-2 empty:p-0"
            >
              {(item: NavItem) => (
                <Autocomplete.Item
                  key={item.url}
                  value={item}
                  onClick={() => navigate(item)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    strokeWidth={1.75}
                    className="size-[18px] shrink-0"
                  />
                  <span className="flex-1">{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.url}
                  </span>
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Root>
          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            ↑↓ to choose · Enter to open · Esc to close
          </p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
