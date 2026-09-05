import { resolve } from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

// Standalone browser fixture. No app auth routes, provider credentials, or .env files.
const dashboard = resolve(import.meta.dir, "../..");
const shims = resolve(import.meta.dir, "onboarding-shims.tsx");
const result = await Bun.build({
  entrypoints: [resolve(import.meta.dir, "onboarding-app.tsx")],
  target: "browser",
  tsconfig: resolve(dashboard, "tsconfig.json"),
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "local-onboarding-fixtures",
      setup(build) {
        build.onResolve(
          {
            filter:
              /^(next\/link|next\/navigation|@workos-inc\/authkit-nextjs|convex\/react|@\/lib\/convex-server|@\/components\/extraction-onboarding)$/,
          },
          () => ({ path: shims }),
        );
      },
    },
  ],
});
if (!result.success) throw new Error(result.logs.join("\n"));
const cssPath = resolve(dashboard, "app/globals.css");
const css = await postcss([tailwind({ base: dashboard })]).process(
  await Bun.file(cssPath).text(),
  { from: cssPath },
);

Bun.serve({
  hostname: "127.0.0.1",
  port: 3112,
  fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/fixture.js")
      return new Response(result.outputs[0], {
        headers: { "Content-Type": "text/javascript" },
      });
    if (path === "/fixture.css")
      return new Response(css.css, { headers: { "Content-Type": "text/css" } });
    return new Response(
      '<!doctype html><html style="--font-sans: Arial, Helvetica, sans-serif"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Onboarding local fixture</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
      { headers: { "Content-Type": "text/html" } },
    );
  },
});
console.log(
  "Mock onboarding fixture at http://127.0.0.1:3112. Use only fixture- prefixed dummy keys.",
);
