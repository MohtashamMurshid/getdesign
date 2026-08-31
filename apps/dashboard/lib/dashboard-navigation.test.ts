import { describe, expect, test } from "bun:test"
import { existsSync } from "node:fs"
import path from "node:path"
import {
  NAV_COMMANDS,
  NAV_MAIN,
  NAV_SECONDARY,
  matchesNavigation,
} from "./dashboard-navigation"
import { isApplePlatform, isNavigationShortcut } from "./navigation-shortcuts"

describe("dashboard navigation commands", () => {
  test("uses the sidebar destinations, each with an existing page and unique URL", () => {
    expect(NAV_COMMANDS).toEqual([...NAV_MAIN, ...NAV_SECONDARY])
    expect(new Set(NAV_COMMANDS.map((item) => item.url)).size).toBe(
      NAV_COMMANDS.length
    )
    for (const item of NAV_COMMANDS) {
      expect(item.url.startsWith("/")).toBe(true)
      expect(
        existsSync(
          path.join(import.meta.dir, "../app/(dashboard)", item.url, "page.tsx")
        )
      ).toBe(true)
    }
  })

  test("blank searches show all pages", () => {
    expect(
      NAV_COMMANDS.filter((item) => matchesNavigation(item, "  "))
    ).toEqual(NAV_COMMANDS)
  })

  test("matches titles without case sensitivity", () => {
    expect(
      NAV_COMMANDS.filter((item) => matchesNavigation(item, " sDk ")).map(
        (item) => item.url
      )
    ).toEqual(["/sdk"])
  })

  test("matches routes and multiple keyword tokens", () => {
    for (const query of [
      "/account",
      "provider keys",
      "keys settings",
      "ACCOUNT",
    ]) {
      expect(
        NAV_COMMANDS.filter((item) => matchesNavigation(item, query)).map(
          (item) => item.url
        )
      ).toEqual(["/account"])
    }
  })

  test("unmatched text returns no commands", () => {
    expect(
      NAV_COMMANDS.filter((item) => matchesNavigation(item, "no-such-page"))
    ).toEqual([])
  })
})

describe("navigation shortcuts", () => {
  const event = {
    key: "k",
    metaKey: true,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    repeat: false,
    isComposing: false,
    defaultPrevented: false,
  }

  test("supports Cmd+K and Ctrl+K", () => {
    expect(isNavigationShortcut(event, "k")).toBe(true)
    expect(
      isNavigationShortcut({ ...event, metaKey: false, ctrlKey: true }, "k")
    ).toBe(true)
  })

  test("normalizes the key and leaves the sidebar shortcut distinct", () => {
    expect(isNavigationShortcut({ ...event, key: "K" }, "k")).toBe(true)
    expect(isNavigationShortcut({ ...event, key: "b" }, "k")).toBe(false)
    expect(isNavigationShortcut({ ...event, key: "b" }, "b")).toBe(true)
  })

  for (const flag of [
    "altKey",
    "shiftKey",
    "repeat",
    "isComposing",
    "defaultPrevented",
  ] as const) {
    test(`ignores ${flag}`, () => {
      expect(isNavigationShortcut({ ...event, [flag]: true }, "k")).toBe(false)
    })
  }

  test("leaves unmodified K alone", () => {
    expect(isNavigationShortcut({ ...event, metaKey: false }, "k")).toBe(false)
  })

  test("shows the Mac shortcut only on Apple platforms", () => {
    for (const platform of ["MacIntel", "iPhone", "iPad"])
      expect(isApplePlatform(platform)).toBe(true)
    for (const platform of ["Win32", "Linux x86_64", ""])
      expect(isApplePlatform(platform)).toBe(false)
  })
})
