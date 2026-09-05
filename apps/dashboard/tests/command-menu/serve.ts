// Local-only browser fixture. No auth, Convex, provider keys or extraction calls.
// Run from the repo root: bun apps/dashboard/tests/command-menu/serve.ts
import path from "node:path"
import postcss from "postcss"
import tailwindcss from "@tailwindcss/postcss"

const dashboard = path.resolve(import.meta.dir, "../..")
const bundle = await Bun.build({
  entrypoints: [path.join(import.meta.dir, "fixture.tsx")],
  target: "browser",
  define: { "process.env.NODE_ENV": JSON.stringify("development") },
  plugins: [
    {
      name: "fixture-boundaries",
      setup(build) {
        build.onResolve({ filter: /^next\/(link|navigation)$/ }, () => ({
          path: path.join(import.meta.dir, "navigation.tsx"),
        }))
        build.onResolve({ filter: /^@\/app\/actions\/auth$/ }, () => ({
          path: "auth",
          namespace: "fixture",
        }))
        build.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents:
            'export function signOutAction() { throw new Error("Server actions are disabled in this fixture") }',
          loader: "js",
        }))
      },
    },
  ],
})
if (!bundle.success)
  throw new AggregateError(bundle.logs, "Fixture build failed")
const cssPath = path.join(dashboard, "app/globals.css")
const css = await postcss([tailwindcss({ base: dashboard })]).process(
  await Bun.file(cssPath).text(),
  { from: cssPath }
)

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 3115,
  fetch(request) {
    const pathname = new URL(request.url).pathname
    if (pathname === "/fixture.js")
      return new Response(bundle.outputs[0], {
        headers: { "Content-Type": "text/javascript" },
      })
    if (pathname === "/fixture.css")
      return new Response(css.css, { headers: { "Content-Type": "text/css" } })
    if (request.method !== "GET")
      return new Response("Disabled in fixture", { status: 405 })
    return new Response(
      '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Command menu fixture</title><link rel="stylesheet" href="/fixture.css"><style>:root{--font-sans:Arial,sans-serif;--font-mono:monospace}</style></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
      { headers: { "Content-Type": "text/html" } }
    )
  },
})
console.log(`Command menu fixture: ${server.url}`)
