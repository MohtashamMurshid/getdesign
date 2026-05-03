# @getdesign/agent

Agent runtime for turning live websites into structured design systems and
`design.md` specs. It coordinates crawling, Daytona Computer Use capture, visual
description, token extraction, synthesis, and markdown rendering.

Most users should install `@getdesign/sdk` or `@getdesign/cli` instead. This
package is published so the local execution SDK can depend on the agent runtime.

## Main interface

```ts
import { runDesign } from "@getdesign/agent";

const result = await runDesign("https://example.com", {
  credentials: {
    daytonaApiKey: process.env.DAYTONA_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
});
```

MIT © getdesign
