type ShortcutEvent = Pick<
  KeyboardEvent,
  | "key"
  | "metaKey"
  | "ctrlKey"
  | "altKey"
  | "shiftKey"
  | "repeat"
  | "isComposing"
  | "defaultPrevented"
>

export function isNavigationShortcut(event: ShortcutEvent, key: string) {
  return (
    event.key.toLowerCase() === key &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey &&
    !event.repeat &&
    !event.isComposing &&
    !event.defaultPrevented
  )
}

export function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      !!target.closest(
        'input, textarea, select, [role="textbox"], [role="combobox"]'
      ))
  )
}

// Includes custom lightboxes and the account dropdown, not just Base UI dialogs.
export function hasOpenNavigationOverlay() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="dialog"], [role="alertdialog"], [role="menu"], dialog[open]'
    )
  ).some(
    (element) =>
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== "hidden"
  )
}

export function isApplePlatform(platform: string) {
  return /Mac|iPhone|iPad|iPod/i.test(platform)
}
