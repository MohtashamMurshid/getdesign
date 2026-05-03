# @getdesign/sdk

> The design system for any URL — TypeScript SDK.

Remote-first TypeScript client for the getdesign HTTP API.

## Install

```bash
bun add @getdesign/sdk
```

The SDK uses the platform `fetch` API and works in modern Node, Bun, Deno, and
edge runtimes.

## Preview

```ts
import { getDesign } from "@getdesign/sdk";

const system = await getDesign("https://cursor.com", {
  credentials: {
    daytonaApiKey: process.env.DAYTONA_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
});
console.log(system.markdown);
```

## Streaming

```ts
import { streamDesign } from "@getdesign/sdk";

for await (const event of streamDesign("https://linear.app", {
  credentials: {
    daytonaApiKey: process.env.DAYTONA_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
})) {
  if (event.type === "progress") console.log(event.event);
  if (event.type === "result") console.log(event.result.markdown);
}
```

MIT © getdesign
