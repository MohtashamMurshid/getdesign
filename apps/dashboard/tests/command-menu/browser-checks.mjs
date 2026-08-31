// Run through the Browser skill's Node session with the connected fixture tab:
// const { verifyCommandMenu } = await import("<absolute path>/browser-checks.mjs")
// nodeRepl.write(await verifyCommandMenu(tab))
// Uses Browser skill input APIs. Does not modify page state via evaluate.
// Set nativeKeyboard: false only when the fixture probe confirms the browser
// sends untrusted events without native button activation or Tab movement.
export async function verifyCommandMenu(tab, { nativeKeyboard = true } = {}) {
  if (!String(await tab.url()).startsWith("http://127.0.0.1:3115/")) {
    throw new Error(
      "Run only against the local command-menu fixture on port 3115"
    )
  }
  const passed = []
  const skipped = []
  function check(value, name) {
    if (!value) throw new Error(`FAIL: ${name}`)
    passed.push(name)
  }
  const search = () =>
    tab.playwright.getByRole("combobox", { name: "Search pages" })
  const origin = () =>
    tab.playwright.getByRole("button", { name: "Focus return target" })
  const dialog = () =>
    tab.playwright.getByRole("dialog", { name: "Go to page" })
  const focusLabel = () =>
    tab.playwright.evaluate(
      () =>
        document.activeElement?.getAttribute("aria-label") ??
        document.activeElement?.textContent
    )
  const highlight = () =>
    tab.playwright
      .getByRole("option")
      .evaluateAll(
        (items) =>
          items.find((item) => item.hasAttribute("data-highlighted"))
            ?.textContent
      )

  await origin().press("Meta+k")
  check(
    (await dialog().count()) === 1 && (await focusLabel()) === "Search pages",
    "Cmd+K opens from collapsed sidebar and focuses search"
  )
  check(
    (await search().getAttribute("aria-expanded")) === "true" &&
      (await search().getAttribute("aria-controls")) ===
        (await tab.playwright.getByRole("listbox", { name: "Pages" }).getAttribute("id")),
    "Combobox exposes expanded state and its listbox relationship"
  )
  check((await highlight()) === "Overview/", "First command highlighted")
  await search().press("ArrowDown")
  check((await highlight()) === "Agent/agent", "ArrowDown chooses Agent")
  await search().press("ArrowUp")
  check((await highlight()) === "Overview/", "ArrowUp chooses Overview")
  await search().press("ArrowUp")
  check(
    (await highlight()) === "Settings/account",
    "ArrowUp wraps to last command"
  )
  await search().press("Escape")
  check(
    (await dialog().count()) === 0 &&
      (await focusLabel()) === "Focus return target",
    "Escape closes and restores keyboard origin"
  )

  await origin().press("Control+k")
  check((await dialog().count()) === 1, "Ctrl+K opens")
  await search().press("Control+k")
  check(
    (await dialog().count()) === 0,
    "Ctrl+K toggles closed without inserting text"
  )
  await origin().press("Meta+b")
  check(
    await tab.playwright
      .getByRole("button", { name: "Search pages", exact: true })
      .isVisible(),
    "Cmd+B still expands sidebar"
  )
  await tab.playwright
    .getByRole("button", { name: "Search pages", exact: true })
    .click()
  check(
    (await dialog().count()) === 1 && (await focusLabel()) === "Search pages",
    "Search button opens and focuses input"
  )
  await search().press("Escape")
  check(
    (await focusLabel()) === "Search pages",
    "Escape restores Search button focus"
  )
  if (nativeKeyboard) {
    await tab.playwright
      .getByRole("button", { name: "Search pages", exact: true })
      .press("Enter")
    check((await dialog().count()) === 1, "Search button activates with Enter")
    await search().press("Tab")
    check(
      (await focusLabel()) === "Close command menu",
      "Tab reaches the close button"
    )
    await tab.playwright
      .getByRole("button", { name: "Close command menu" })
      .press("Tab")
    check(
      (await focusLabel()) === "Search pages",
      "Tab remains inside the dialog"
    )
    await search().press("Shift+Tab")
    check((await focusLabel()) === "Close command menu", "Shift+Tab stays inside the dialog")
    await tab.playwright.getByRole("button", { name: "Close command menu" }).press("Escape")
    await tab.playwright.getByRole("button", { name: "Search pages", exact: true }).press("Space")
    check((await dialog().count()) === 1, "Search button activates with Space")
  } else {
    skipped.push(
      "Native Enter/Space activation of Search",
      "Native Tab focus-trap cycling"
    )
    await tab.playwright
      .getByRole("button", { name: "Search pages", exact: true })
      .click()
  }
  await search().press("Meta+b")
  check(
    (await dialog().count()) === 1,
    "Sidebar shortcut does not dismiss the menu"
  )
  await search().fill("no-such-page")
  check(
    (await tab.playwright
      .getByText("No pages found. Try another search.")
      .isVisible()) && (await tab.playwright.getByRole("option").count()) === 0,
    "No-results state shown"
  )
  const noResultsUrl = await tab.url()
  await search().press("Enter")
  check(
    (await tab.url()) === noResultsUrl && (await dialog().count()) === 1,
    "Enter with no results does not navigate"
  )
  await search().fill(" pRoViDeR   KeYs ")
  check(
    (await tab.playwright.getByRole("option").count()) === 1 &&
      (await highlight()) === "Settings/account",
    "Filtering supports case, whitespace and keywords"
  )
  await search().press("Enter")
  check(
    (await tab.url()) === "http://127.0.0.1:3115/account" &&
      (await dialog().count()) === 0,
    "Enter navigates Settings to /account and closes"
  )

  // All routes below were observed in the sidebar and verified against page files.
  const destinations = [
    ["Overview", "/"],
    ["Agent", "/agent"],
    ["API", "/api"],
    ["CLI", "/cli"],
    ["SDK", "/sdk"],
    ["Skills", "/skills"],
    ["Support", "/support"],
    ["Docs", "/docs"],
    ["Settings", "/account"],
  ]
  for (const [title, route] of destinations) {
    await origin().press("Meta+k")
    check(
      (await tab.playwright.getByRole("option").count()) === 9,
      `Reopening clears search before ${title}`
    )
    await search().fill(title)
    check(
      (await tab.playwright.getByRole("option").count()) === 1,
      `${title} filters to one command`
    )
    await search().press("Enter")
    check(
      (await tab.url()) === `http://127.0.0.1:3115${route}` &&
        (await dialog().count()) === 0,
      `${title} navigates to ${route}`
    )
  }
  await origin().press("Meta+k")
  check((await dialog().count()) === 1, "Reopen for pointer selection")
  await tab.playwright
    .getByRole("option", { name: "Docs /docs", exact: true })
    .click()
  check(
    (await tab.url()) === "http://127.0.0.1:3115/docs" &&
      (await dialog().count()) === 0,
    "Pointer selection navigates and closes"
  )

  for (const label of [
    "Editable input",
    "Editable textarea",
    "Editable document",
  ]) {
    await tab.playwright
      .getByRole("textbox", { name: label, exact: true })
      .press("Meta+k")
    check((await dialog().count()) === 0, `Cmd+K leaves ${label} alone`)
    await tab.playwright
      .getByRole("textbox", { name: label, exact: true })
      .press("Control+k")
    check((await dialog().count()) === 0, `Ctrl+K leaves ${label} alone`)
    await tab.playwright
      .getByRole("textbox", { name: label, exact: true })
      .press("Meta+b")
    check(
      await tab.playwright
        .getByRole("button", { name: "Search pages", exact: true })
        .isVisible(),
      `Cmd+B leaves ${label} alone`
    )
  }
  await tab.playwright
    .getByRole("button", { name: "Open another dialog" })
    .click()
  check(
    (await tab.playwright
      .getByRole("dialog", { name: "Another dialog" })
      .count()) === 1,
    "Other dialog opens"
  )
  await tab.playwright
    .getByRole("button", { name: "Close another dialog" })
    .press("Meta+k")
  check(
    (await dialog().count()) === 0,
    "Cmd+K does not stack over another dialog"
  )
  await tab.playwright
    .getByRole("button", { name: "Close another dialog" })
    .press("Control+k")
  check(
    (await dialog().count()) === 0,
    "Ctrl+K does not stack over another dialog"
  )
  await tab.playwright
    .getByRole("button", { name: "Close another dialog" })
    .press("Escape")
  check(
    (await tab.playwright.getByRole("dialog").count()) === 0,
    "Escape dismisses only the other dialog"
  )
  await tab.playwright
    .getByRole("button", { name: "FU Fixture User fixture@example.test" })
    .click()
  check(
    (await tab.playwright.getByRole("menu").count()) === 1,
    "Account dropdown opens"
  )
  await tab.playwright
    .getByRole("menuitem", { name: "Account", exact: true })
    .press("Meta+k")
  check(
    (await dialog().count()) === 0 &&
      (await tab.playwright.getByRole("menu").count()) === 1,
    "Cmd+K leaves account dropdown alone"
  )
  await tab.playwright
    .getByRole("menuitem", { name: "Account", exact: true })
    .press("Escape")
  await tab.playwright.getByRole("menu").waitFor({ state: "detached" })
  check(
    (await tab.playwright.getByRole("menu").count()) === 0,
    "Account dropdown dismisses"
  )
  return { passed: passed.length, checks: passed, skipped }
}
