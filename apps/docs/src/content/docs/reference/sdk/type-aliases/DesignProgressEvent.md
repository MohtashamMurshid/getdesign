---
editUrl: false
next: false
prev: false
title: "DesignProgressEvent"
---

> **DesignProgressEvent** = \{ `phase`: `"crawl"`; `siteName?`: `string`; `status`: `"start"` \| `"ok"`; `stylesheets?`: `number`; \} \| \{ `capturePhase`: `string`; `detail?`: `string`; `durationMs?`: `number`; `phase`: `"capture"`; `status`: `string`; \} \| \{ `phase`: `"visual"`; `status`: `"start"` \| `"ok"`; `visualStatus?`: `string`; \} \| \{ `detail?`: `string`; `phase`: `"describe"`; `status`: `"start"` \| `"ok"`; \} \| \{ `fontFamilies?`: `number`; `phase`: `"extract"`; `status`: `"start"` \| `"ok"`; \} \| \{ `paletteGroups?`: `number`; `phase`: `"synthesize"`; `status`: `"start"` \| `"ok"`; \} \| \{ `markdownLength?`: `number`; `phase`: `"render"`; `status`: `"start"` \| `"ok"`; \}

Defined in: [packages/sdk/src/index.ts:51](https://github.com/MohtashamMurshid/getdesign/blob/431a074a3f895c83c413dd5e8c64fd460dbdd75e/packages/sdk/src/index.ts#L51)
