import * as React from "react"

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener)
  return () => window.removeEventListener("popstate", listener)
}

function push(url: string) {
  window.history.pushState(null, "", url)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

export function usePathname() {
  return React.useSyncExternalStore(subscribe, () => window.location.pathname)
}

export function useRouter() {
  return { push }
}

export default function Link({
  href,
  onClick,
  ...props
}: React.ComponentProps<"a">) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented && href) {
          event.preventDefault()
          push(href)
        }
      }}
    />
  )
}
