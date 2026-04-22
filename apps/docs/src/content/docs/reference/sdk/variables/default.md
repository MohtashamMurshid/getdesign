---
editUrl: false
next: false
prev: false
title: "default"
---

> **default**: `object`

Defined in: [sdk/src/index.ts:47](https://github.com/MohtashamMurshid/getdesign/blob/03302ffe7bb4023d88cd9ccc94c3e88d30d53763/packages/sdk/src/index.ts#L47)

## Type Declaration

### getDesign

> **getDesign**: (`url`, `_options`) => `Promise`\<\{ `doc`: \{ `agentPromptGuide`: \{ `examplePrompts`: `string`[]; `iterationGuide`: `string`[]; `quickColorReference`: `string`[]; \}; `components`: \{ `buttons`: `object`[]; `cards`: \{ `description`: `string`; `tokens`: `string`[]; \}; `distinctive`: `object`[]; `imageTreatment`: \{ `description`: `string`; `tokens`: `string`[]; \}; `inputs`: \{ `description`: `string`; `tokens`: `string`[]; \}; `navigation`: \{ `description`: `string`; `tokens`: `string`[]; \}; \}; `depth`: \{ `levels`: `object`[]; `philosophy`: `string`; \}; `interaction`: \{ `focusStates`: `string`; `hoverStates`: `string`; `transitions`: `string`; \}; `layout`: \{ `grid`: `string`; `radiusScale`: `string`; `spacingScale`: `string`; `whitespace`: `string`; \}; `palette`: \{ `groups`: `object`[]; `notes`: `string`; `philosophy`: `string`; \}; `responsive`: \{ `breakpoints`: `object`[]; `collapsingStrategy`: `string`; `imageBehavior`: `string`; `touchTargets`: `string`; \}; `siteName`: `string`; `sourceUrl`: `string`; `typography`: \{ `hierarchy`: `object`[]; `principles`: `string`[]; `summary`: `string`; \}; `visualTheme`: \{ `keyCharacteristics`: `string`[]; `overview`: `string`[]; \}; \}; `markdown`: `string`; `runId`: `string`; `tokens?`: \{ `borders`: `object`[]; `breakpoints`: `object`[]; `colors`: \{ `accent`: `object`[]; `borders`: `object`[]; `neutral`: `object`[]; `primary`: `object`[]; `semantic`: \{ `error`: `object`[]; `info`: `object`[]; `success`: `object`[]; `warning`: `object`[]; \}; `surfaces`: `object`[]; \}; `radii`: `object`[]; `shadows`: `object`[]; `siteName`: `string`; `sources`: `string`[]; `sourceUrl`: `string`; `spacing`: `object`[]; `typography`: \{ `fontFamilies`: `object`[]; `scale`: `object`[]; \}; \}; \}\>

Placeholder. The real implementation is in private beta.
Join the waitlist at https://getdesign.app to get early access.

#### Parameters

##### url

`string`

##### \_options?

[`GetDesignOptions`](/reference/sdk/type-aliases/getdesignoptions/) = `{}`

#### Returns

`Promise`\<\{ `doc`: \{ `agentPromptGuide`: \{ `examplePrompts`: `string`[]; `iterationGuide`: `string`[]; `quickColorReference`: `string`[]; \}; `components`: \{ `buttons`: `object`[]; `cards`: \{ `description`: `string`; `tokens`: `string`[]; \}; `distinctive`: `object`[]; `imageTreatment`: \{ `description`: `string`; `tokens`: `string`[]; \}; `inputs`: \{ `description`: `string`; `tokens`: `string`[]; \}; `navigation`: \{ `description`: `string`; `tokens`: `string`[]; \}; \}; `depth`: \{ `levels`: `object`[]; `philosophy`: `string`; \}; `interaction`: \{ `focusStates`: `string`; `hoverStates`: `string`; `transitions`: `string`; \}; `layout`: \{ `grid`: `string`; `radiusScale`: `string`; `spacingScale`: `string`; `whitespace`: `string`; \}; `palette`: \{ `groups`: `object`[]; `notes`: `string`; `philosophy`: `string`; \}; `responsive`: \{ `breakpoints`: `object`[]; `collapsingStrategy`: `string`; `imageBehavior`: `string`; `touchTargets`: `string`; \}; `siteName`: `string`; `sourceUrl`: `string`; `typography`: \{ `hierarchy`: `object`[]; `principles`: `string`[]; `summary`: `string`; \}; `visualTheme`: \{ `keyCharacteristics`: `string`[]; `overview`: `string`[]; \}; \}; `markdown`: `string`; `runId`: `string`; `tokens?`: \{ `borders`: `object`[]; `breakpoints`: `object`[]; `colors`: \{ `accent`: `object`[]; `borders`: `object`[]; `neutral`: `object`[]; `primary`: `object`[]; `semantic`: \{ `error`: `object`[]; `info`: `object`[]; `success`: `object`[]; `warning`: `object`[]; \}; `surfaces`: `object`[]; \}; `radii`: `object`[]; `shadows`: `object`[]; `siteName`: `string`; `sources`: `string`[]; `sourceUrl`: `string`; `spacing`: `object`[]; `typography`: \{ `fontFamilies`: `object`[]; `scale`: `object`[]; \}; \}; \}\>

### streamDesign

> **streamDesign**: (`url`, `_options`) => `AsyncGenerator`\<`string`, `void`, `void`\>

Placeholder streaming API. Yields nothing today.

#### Parameters

##### url

`string`

##### \_options?

[`GetDesignOptions`](/reference/sdk/type-aliases/getdesignoptions/) = `{}`

#### Returns

`AsyncGenerator`\<`string`, `void`, `void`\>

### version

> **version**: `string`
