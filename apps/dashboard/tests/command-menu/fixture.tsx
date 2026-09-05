import * as React from "react"
import { createRoot } from "react-dom/client"
import { Dialog } from "@base-ui/react/dialog"
import { AppSidebar } from "../../components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import { ThemeProvider } from "../../components/theme-provider"
import { usePathname } from "./navigation"

function Fixture() {
  const pathname = usePathname()
  const [nativeClicks, setNativeClicks] = React.useState(0)
  const [lastKey, setLastKey] = React.useState("none")
  return (
    <ThemeProvider defaultTheme="light">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar
          user={{
            name: "Fixture User",
            email: "fixture@example.test",
            avatar: "",
          }}
        />
        <SidebarInset className="gap-4 p-8">
          <h1 className="text-xl font-semibold">Command menu verification</h1>
          <p>
            Isolated fixture. Authentication, server actions and Next routing
            are mocked.
          </p>
          <p role="status">Current route: {pathname}</p>
          <SidebarTrigger />
          <button type="button">Focus return target</button>
          <button
            type="button"
            onClick={() => setNativeClicks((count) => count + 1)}
            onKeyDown={(event) =>
              setLastKey(`${event.key}, trusted=${event.nativeEvent.isTrusted}`)
            }
          >
            Native keyboard probe
          </button>
          <p>
            Native probe clicks: {nativeClicks}; last key: {lastKey}
          </p>
          <label>
            Editable input
            <input className="border" aria-label="Editable input" />
          </label>
          <label>
            Editable textarea
            <textarea className="border" aria-label="Editable textarea" />
          </label>
          <div
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Editable document"
            className="border"
          >
            Editable document
          </div>
          <Dialog.Root>
            <Dialog.Trigger>Open another dialog</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
              <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-popover p-8">
                <Dialog.Title>Another dialog</Dialog.Title>
                <Dialog.Description>Shortcut conflict check</Dialog.Description>
                <Dialog.Close>Close another dialog</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  )
}

createRoot(document.getElementById("root")!).render(<Fixture />)
