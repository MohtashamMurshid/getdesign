import { renderDesignMd } from "@getdesign/tools/render";

import type { CrawlSiteResult } from "@getdesign/tools";
import type { DesignDoc, DesignTokens } from "@getdesign/types";

import { runCrawl } from "./agents/crawler";
import { runExtractTokens } from "./agents/tokenExtractor";
import { runSynthesize } from "./agents/synthesizer";
import { runVisual, type VisualResult } from "./agents/visual";
import { resolveModel } from "./model";
import type { LanguageModel } from "ai";
import type { CaptureRuntimeStatus } from "@getdesign/tools/daytona";

export type RunDesignPhase =
  | "crawl"
  | "capture_runtime"
  | "visual"
  | "extract"
  | "synthesize"
  | "render";

export type CaptureRuntimeEvent = {
  status: CaptureRuntimeStatus;
  snapshotName: string;
  message?: string;
};

export type RunDesignEvent =
  | { phase: "crawl"; crawl: CrawlSiteResult }
  | { phase: "capture_runtime"; event: CaptureRuntimeEvent }
  | { phase: "visual"; visual: VisualResult }
  | { phase: "extract"; tokens: DesignTokens }
  | { phase: "synthesize"; doc: DesignDoc }
  | { phase: "render"; markdown: string };

/**
 * How the run should react when the visual capture path is unavailable
 * (e.g. snapshot provisioning failure, capture failure, or missing key).
 *
 * - `"require"`: fail the run with `RunDesignError` so the caller can prompt
 *   the user before retrying as text-only. This is the safe default for
 *   hosted runs where visual fidelity is the product promise.
 * - `"text_only_fallback"`: continue without screenshots and mark the
 *   resulting run as `text_only`. Use only after the user has explicitly
 *   acknowledged the loss of visual capture.
 * - `"skip_silently"`: legacy behavior. Continue without screenshots and
 *   without marking the run as text-only. Reserved for local development
 *   where Daytona is intentionally not configured.
 */
export type VisualRequirement =
  | "require"
  | "text_only_fallback"
  | "skip_silently";

export type RunDesignCredentials = {
  /** Per-run Daytona key. Falls back to `DAYTONA_API_KEY` when omitted. */
  daytonaApiKey?: string;
  /**
   * Per-run OpenAI key. The model resolver also reads `OPENAI_API_KEY` and
   * `AI_GATEWAY_API_KEY` from the environment when this is omitted.
   */
  openaiApiKey?: string;
};

export type RunDesignOptions = {
  model?: LanguageModel;
  captureFullPage?: boolean;
  /** Optional per-run snapshot override. Internal/dev use only. */
  snapshot?: string;
  /** Visual capture policy. Defaults to `"require"`. */
  visualRequirement?: VisualRequirement;
  /** Request-scoped credentials for hosted API/CLI runs. */
  credentials?: RunDesignCredentials;
  onPhase?: (event: RunDesignEvent) => void | Promise<void>;
};

export type RunDesignResult = {
  url: string;
  markdown: string;
  doc: DesignDoc;
  tokens: DesignTokens;
  crawl: CrawlSiteResult;
  visual: VisualResult;
  /**
   * Output mode of this run. `"visual"` means a hero screenshot was used;
   * `"text_only"` means visual capture was unavailable and the user accepted
   * a text-only run. The render layer uses this to mark the design doc.
   */
  mode: "visual" | "text_only";
};

export class RunDesignError extends Error {
  readonly code:
    | "capture_runtime_unavailable"
    | "capture_failed";
  readonly snapshot?: string;
  readonly visual: VisualResult;

  constructor(
    code: "capture_runtime_unavailable" | "capture_failed",
    visual: VisualResult,
  ) {
    const reason =
      visual.status === "runtime_unavailable" || visual.status === "failed"
        ? visual.reason
        : "Visual capture unavailable.";
    super(reason);
    this.name = "RunDesignError";
    this.code = code;
    this.visual = visual;
    this.snapshot =
      "snapshot" in visual && typeof visual.snapshot === "string"
        ? visual.snapshot
        : undefined;
  }
}

/**
 * Imperative one-shot driver: crawl -> capture_runtime -> visual -> extract -> synthesize -> render.
 *
 * Hosted callers should pass `credentials` with the authenticated user's
 * Daytona/OpenAI keys. CLI direct mode should leave credentials empty so
 * the env-based fallback applies. The visual phase uses the per-user
 * versioned snapshot resolved by `@getdesign/tools/daytona` and emits
 * `capture_runtime` events while the snapshot is provisioned.
 */
export async function runDesign(
  url: string,
  options: RunDesignOptions = {},
): Promise<RunDesignResult> {
  const visualRequirement = options.visualRequirement ?? "require";
  const credentials = options.credentials;
  const model =
    options.model ?? resolveModel({ apiKey: credentials?.openaiApiKey });

  const crawl = await runCrawl({ url });
  await options.onPhase?.({ phase: "crawl", crawl });

  const visual = await runVisual(
    {
      url: crawl.sourceUrl,
      snapshot: options.snapshot,
      captureFullPage: options.captureFullPage ?? false,
    },
    {
      daytonaApiKey: credentials?.daytonaApiKey,
      onCaptureRuntimeStatus: (event) => {
        void options.onPhase?.({ phase: "capture_runtime", event });
      },
    },
  );
  await options.onPhase?.({ phase: "visual", visual });

  if (visual.status === "runtime_unavailable" || visual.status === "failed") {
    if (visualRequirement === "require") {
      throw new RunDesignError(
        visual.status === "runtime_unavailable"
          ? "capture_runtime_unavailable"
          : "capture_failed",
        visual,
      );
    }
  }

  const mode: RunDesignResult["mode"] =
    visual.status === "captured"
      ? "visual"
      : visualRequirement === "skip_silently"
        ? "visual"
        : "text_only";

  const tokens = runExtractTokens(crawl);
  await options.onPhase?.({ phase: "extract", tokens });

  const hero = visual.status === "captured" ? visual.hero : undefined;

  const { doc } = await runSynthesize({
    sourceUrl: crawl.sourceUrl,
    siteName: crawl.siteName,
    tokens,
    hero,
    crawlNotes: crawl.notes,
    model,
  });
  await options.onPhase?.({ phase: "synthesize", doc });

  const baseMarkdown = renderDesignMd(doc);
  const markdown =
    mode === "text_only" ? prependTextOnlyBanner(baseMarkdown) : baseMarkdown;
  await options.onPhase?.({ phase: "render", markdown });

  return {
    url: crawl.sourceUrl,
    markdown,
    doc,
    tokens,
    crawl,
    visual,
    mode,
  };
}

function prependTextOnlyBanner(markdown: string): string {
  const banner = [
    "> **Note:** This design.md was produced in text-only mode. The Daytona-based full landing page capture was unavailable for this run, so visual sections are derived from CSS tokens alone and may not reflect imagery, layout depth, or interaction polish from the live site.",
    "",
  ].join("\n");
  return `${banner}\n${markdown}`;
}
