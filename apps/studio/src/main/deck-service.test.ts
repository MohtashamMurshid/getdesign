import { describe, expect, test } from "bun:test";

import type { StudioDeckSlideContent } from "../shared/studio-api";
import {
  buildSlides,
  getDeckDimensionsForMode,
  renderSlideHtml,
  renderTokensCss,
} from "./deck-template-rendering";

describe("deck-service generated deck helpers", () => {
  test("preserves speaker notes in generated slide manifests", () => {
    const slides = buildSlides([
      {
        label: "Intro",
        title: "Welcome",
        notes: "Open with the customer pain.",
      },
    ] satisfies StudioDeckSlideContent[]);

    expect(slides[0]).toMatchObject({
      file: "slides/01-intro.html",
      notes: "Open with the customer pain.",
    });
  });

  test("uses 1280x720 assets and tweaks css for pptx-safe starter slides", () => {
    const [slide] = buildSlides([
      {
        label: "Cover",
        title: "Launch",
      },
    ] satisfies StudioDeckSlideContent[]);

    const html = renderSlideHtml({
      title: "Launch deck",
      slide: slide!,
      content: { label: "Cover", title: "Launch" },
      index: 0,
      total: 1,
      mode: "pptx-safe",
    });

    expect(getDeckDimensionsForMode("pptx-safe")).toEqual({ width: 1280, height: 720 });
    expect(html).toContain('<meta name="viewport" content="width=1280,height=720">');
    expect(html).toContain('<link rel="stylesheet" href="../shared/tweaks.css">');
    expect(renderTokensCss("pptx-safe")).toContain("width: 1280px; height: 720px");
  });

  test("keeps freeform starter slides at 1920x1080", () => {
    expect(getDeckDimensionsForMode("freeform")).toEqual({ width: 1920, height: 1080 });
    expect(renderTokensCss("freeform")).toContain("width: 1920px; height: 1080px");
  });
});
