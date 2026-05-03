---
editUrl: false
next: false
prev: false
title: "default"
---

> **default**: `object`

Defined in: [packages/sdk/src/index.ts:281](https://github.com/MohtashamMurshid/getdesign/blob/8c362a81d62456a600b98da64a1b0f3e7a11049e/packages/sdk/src/index.ts#L281)

## Type Declaration

### getDesign

> **getDesign**: (`url`, `options`) => `Promise`\<[`GetDesignResult`](/reference/sdk/type-aliases/getdesignresult/)\>

#### Parameters

##### url

`string`

##### options?

[`GetDesignOptions`](/reference/sdk/type-aliases/getdesignoptions/) = `{}`

#### Returns

`Promise`\<[`GetDesignResult`](/reference/sdk/type-aliases/getdesignresult/)\>

### streamDesign

> **streamDesign**: (`url`, `options`) => `AsyncGenerator`\<[`DesignStreamEvent`](/reference/sdk/type-aliases/designstreamevent/), `void`, `void`\>

#### Parameters

##### url

`string`

##### options?

[`GetDesignOptions`](/reference/sdk/type-aliases/getdesignoptions/) = `{}`

#### Returns

`AsyncGenerator`\<[`DesignStreamEvent`](/reference/sdk/type-aliases/designstreamevent/), `void`, `void`\>

### version

> **version**: `string`
