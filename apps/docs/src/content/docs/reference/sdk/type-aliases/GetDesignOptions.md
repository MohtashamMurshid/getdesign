---
editUrl: false
next: false
prev: false
title: "GetDesignOptions"
---

> **GetDesignOptions** = `object`

Defined in: [packages/sdk/src/index.ts:20](https://github.com/MohtashamMurshid/getdesign/blob/312cdf4db46bb11b2f4a123a8fe28c18e508ff50/packages/sdk/src/index.ts#L20)

## Properties

### credentials?

> `optional` **credentials?**: [`GetDesignCredentials`](/reference/sdk/type-aliases/getdesigncredentials/)

Defined in: [packages/sdk/src/index.ts:24](https://github.com/MohtashamMurshid/getdesign/blob/312cdf4db46bb11b2f4a123a8fe28c18e508ff50/packages/sdk/src/index.ts#L24)

Request-scoped credentials for BYOK runs.

***

### installI18nFonts?

> `optional` **installI18nFonts?**: `boolean`

Defined in: [packages/sdk/src/index.ts:28](https://github.com/MohtashamMurshid/getdesign/blob/312cdf4db46bb11b2f4a123a8fe28c18e508ff50/packages/sdk/src/index.ts#L28)

Force or skip i18n font install. Auto-detected from URL TLD when omitted.

***

### measurementMode?

> `optional` **measurementMode?**: `"cdp"` \| `"visual"` \| `"auto"`

Defined in: [packages/sdk/src/index.ts:30](https://github.com/MohtashamMurshid/getdesign/blob/312cdf4db46bb11b2f4a123a8fe28c18e508ff50/packages/sdk/src/index.ts#L30)

Override measurement strategy. `auto` tries CDP first, then visual-stability.

***

### runDesign?

> `optional` **runDesign?**: (`url`, `options?`) => `Promise`\<`RunDesignResult`\>

Defined in: [packages/sdk/src/index.ts:35](https://github.com/MohtashamMurshid/getdesign/blob/312cdf4db46bb11b2f4a123a8fe28c18e508ff50/packages/sdk/src/index.ts#L35)

Internal/testing seam. Defaults to the real local agent pipeline.
Most callers should not pass this.

#### Parameters

##### url

`string`

##### options?

`RunDesignOptions`

#### Returns

`Promise`\<`RunDesignResult`\>

***

### siteName?

> `optional` **siteName?**: `string`

Defined in: [packages/sdk/src/index.ts:22](https://github.com/MohtashamMurshid/getdesign/blob/312cdf4db46bb11b2f4a123a8fe28c18e508ff50/packages/sdk/src/index.ts#L22)

Override the detected site name.

***

### visualRequirement?

> `optional` **visualRequirement?**: [`VisualRequirement`](/reference/sdk/type-aliases/visualrequirement/)

Defined in: [packages/sdk/src/index.ts:26](https://github.com/MohtashamMurshid/getdesign/blob/312cdf4db46bb11b2f4a123a8fe28c18e508ff50/packages/sdk/src/index.ts#L26)

Continue with text-only output if visual capture is unavailable.
