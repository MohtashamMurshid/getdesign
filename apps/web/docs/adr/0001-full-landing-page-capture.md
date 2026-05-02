# ADR 0001: Full landing page capture

## Status

Accepted

## Context

The web product promises that a submitted site URL is rendered and analyzed as a landing page, not just as static HTML/CSS or an above-the-fold screenshot. The capture must represent the actual rendered page from top to document bottom so the generated `design.md` can reflect layout, visual rhythm, repeated components, and footer treatments.

The existing Daytona setup already provides an isolated Linux desktop with Chromium and Computer Use screenshots. However, wheel-based scrolling and a fixed number of screenshots are not precise enough for an actual full-page capture. Daytona mouse scroll amounts are wheel ticks, not pixels, and many landing pages lazy-load content or include sticky headers, cookie banners, chat widgets, and other overlays that can distort stitched screenshots.

## Decision

Use Daytona as the isolated rendering and screenshot environment, with browser-side measurement and control for full-page capture.

The canonical capture artifact is a set of viewport-sized capture tiles plus metadata. A stitched full-page preview is derived from those tiles for UI preview, download, and export.

The capture pipeline must:

- render the target URL in Chromium inside a Daytona sandbox;
- measure the actual rendered document height from the browser page;
- continue scrolling and re-measuring until the rendered height stabilizes;
- fail rather than silently truncate if the page never reaches a stable rendered height within guardrails;
- dismiss or hide common blocking overlays where possible, without performing login or account flows;
- keep fixed or sticky elements in the first tile, then dedupe repeated fixed elements in later tiles;
- retry transient Daytona or browser failures inside the capture tool, with three total attempts and a fresh sandbox for each attempt;
- send only a curated visual synthesis subset of tiles to the synthesizer while retaining the complete capture for preview and export.

Tiles are not just the canonical visual artifact — they are also the LLM input. Both the VisualDescriber and Synthesizer sub-agents receive the full ordered tile sequence (capped defensively at 12 tiles per call in the Synthesizer; the Describer takes the full sequence so nothing below the fold is lost). The Describer produces a long-form markdown description that is consumed by the Synthesizer alongside the deterministic CSS tokens, so the structured DesignDoc is grounded in what the page actually shows rather than tokens alone.

Headless Chromium full-page screenshots may be used as a fallback, but not as the primary path, because they can differ from the visible desktop session and do not exercise the same future interaction path for hover/click states.

## Consequences

This keeps the product promise aligned with what users expect from “full landing page”: the actual rendered page, not a preset number of viewport slices. It also keeps future interactive capture paths on the same Daytona Computer Use foundation.

The implementation is more complex than a single headless screenshot. It needs page-side measurement, tile metadata, overlay cleanup, fixed-element deduplication, retry logic, and derived stitching. The extra complexity is accepted because the output quality and reliability matter to the core product workflow.

The coordinator should treat capture as a required step. It should receive either a completed capture or a final failure after tool-level retries, not silently continue with text-only output.
