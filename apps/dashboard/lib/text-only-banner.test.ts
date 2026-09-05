import { expect, test } from "bun:test";

import { prependTextOnlyBanner } from "./text-only-banner";

test("prepends the text-only warning without changing the rendered body", () => {
  const markdown = "# Design\n\nBody";
  const rendered = prependTextOnlyBanner(markdown);

  expect(rendered).toStartWith(
    "> **Note:** This design.md was produced in text-only mode.",
  );
  expect(rendered).toEndWith(markdown);
});
