# @getdesign/sdk

> The design system for any URL — TypeScript SDK.

**Coming soon.** Private beta — join the waitlist at [getdesign.app](https://getdesign.app).

## Preview

```ts
import { getDesign } from "@getdesign/sdk";

const system = await getDesign("cursor.com");
console.log(system.markdown);
```

## Streaming

```ts
import { streamDesign } from "@getdesign/sdk";

for await (const chunk of streamDesign("linear.app")) {
  process.stdout.write(chunk);
}
```

MIT © getdesign
