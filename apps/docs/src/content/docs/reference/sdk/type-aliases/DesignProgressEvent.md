---
editUrl: false
next: false
prev: false
title: "DesignProgressEvent"
---

> **DesignProgressEvent** = \{ `phase`: `"crawl"`; `siteName?`: `string`; `status`: `"start"` \| `"ok"`; `stylesheets?`: `number`; \} \| \{ `capturePhase`: `string`; `detail?`: `string`; `durationMs?`: `number`; `phase`: `"capture"`; `status`: `string`; \} \| \{ `phase`: `"visual"`; `status`: `"start"` \| `"ok"`; `visualStatus?`: `string`; \} \| \{ `detail?`: `string`; `phase`: `"describe"`; `status`: `"start"` \| `"ok"`; \} \| \{ `fontFamilies?`: `number`; `phase`: `"extract"`; `status`: `"start"` \| `"ok"`; \} \| \{ `paletteGroups?`: `number`; `phase`: `"synthesize"`; `status`: `"start"` \| `"ok"`; \} \| \{ `markdownLength?`: `number`; `phase`: `"render"`; `status`: `"start"` \| `"ok"`; \}

Defined in: [packages/sdk/src/index.ts:51](https://github.com/MohtashamMurshid/getdesign/blob/99123753389cd9cf98dae10f9817641a73bd7383/packages/sdk/src/index.ts#L51)
