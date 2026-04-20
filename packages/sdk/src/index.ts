/**
 * @getdesign/sdk — placeholder
 *
 * The design system for any URL.
 * Private beta. Join the waitlist at https://getdesign.app
 */

export const version = "0.0.1";

export type DesignDoc = {
  url: string;
  markdown: string;
  generatedAt: string;
};

export type GetDesignOptions = {
  /** Target viewport width for the screenshot pass. */
  viewport?: `${number}x${number}`;
  /** Optional API key (not required during preview). */
  apiKey?: string;
};

/**
 * Placeholder. The real implementation is in private beta.
 * Join the waitlist at https://getdesign.app to get early access.
 */
export async function getDesign(
  url: string,
  _options: GetDesignOptions = {},
): Promise<DesignDoc> {
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
