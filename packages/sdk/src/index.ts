/**
 * @getdesign/sdk — placeholder
 *
 * The design system for any URL.
 * Private beta. Join the waitlist at https://getdesign.app
 */

import type { RenderedDesignResult } from "@getdesign/types";

export const version = "0.0.1";
export type { DesignDoc, DesignTokens, RenderedDesignResult } from "@getdesign/types";

export type GetDesignOptions = {
  /** Target viewport width for the screenshot pass. */
  viewport?: `${number}x${number}`;
  /** Optional API key (not required during preview). */
  apiKey?: string;
};

export type GetDesignResult = RenderedDesignResult;

/**
 * Placeholder. The real implementation is in private beta.
 * Join the waitlist at https://getdesign.app to get early access.
 */
export async function getDesign(
  url: string,
  _options: GetDesignOptions = {},
): Promise<GetDesignResult> {
  throw new Error(
    `@getdesign/sdk is in private beta. Join the waitlist at https://getdesign.app (asked for: ${url})`,
  );
}

/**
 * Placeholder streaming API. Yields nothing today.
 */
export async function* streamDesign(
  url: string,
  _options: GetDesignOptions = {},
): AsyncGenerator<string, void, void> {
  throw new Error(
    `@getdesign/sdk is in private beta. Join the waitlist at https://getdesign.app (asked for: ${url})`,
  );
}

export default { getDesign, streamDesign, version };
