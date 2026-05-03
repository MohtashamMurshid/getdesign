import type { DesignDoc, DesignTokens, RenderedDesignResult } from "@getdesign/types";
import {
  RunDesignError,
  runDesign,
  type RunDesignEvent,
  type RunDesignOptions,
  type RunDesignResult,
} from "@getdesign/agent";

export const version = "0.0.1";
export type { DesignDoc, DesignTokens, RenderedDesignResult } from "@getdesign/types";

export type GetDesignCredentials = {
  daytonaApiKey?: string;
  openaiApiKey?: string;
};

export type VisualRequirement = "require" | "text_only_fallback";

export type GetDesignOptions = {
  /** Override the detected site name. */
  siteName?: string;
  /** Request-scoped credentials for BYOK runs. */
  credentials?: GetDesignCredentials;
  /** Continue with text-only output if visual capture is unavailable. */
  visualRequirement?: VisualRequirement;
  /** Force or skip i18n font install. Auto-detected from URL TLD when omitted. */
  installI18nFonts?: boolean;
  /** Override measurement strategy. `auto` tries CDP first, then visual-stability. */
  measurementMode?: "cdp" | "visual" | "auto";
  /**
   * Internal/testing seam. Defaults to the real local agent pipeline.
   * Most callers should not pass this.
   */
  runDesign?: (
    url: string,
    options?: RunDesignOptions,
  ) => Promise<RunDesignResult>;
};

export type GetDesignResult = {
  url: string;
  markdown: string;
  doc: DesignDoc;
  tokens: DesignTokens;
  visualDescription: string | null;
  tiles: number;
  mode: "visual" | "text_only";
};

export type DesignProgressEvent =
  | { phase: "crawl"; status: "start" | "ok"; siteName?: string; stylesheets?: number }
  | {
      phase: "capture";
      capturePhase: string;
      status: string;
      detail?: string;
      durationMs?: number;
    }
  | { phase: "visual"; status: "start" | "ok"; visualStatus?: string }
  | { phase: "describe"; status: "start" | "ok"; detail?: string }
  | { phase: "extract"; status: "start" | "ok"; fontFamilies?: number }
  | { phase: "synthesize"; status: "start" | "ok"; paletteGroups?: number }
  | { phase: "render"; status: "start" | "ok"; markdownLength?: number };

export type DesignStreamEvent =
  | { type: "progress"; event: DesignProgressEvent }
  | { type: "result"; result: GetDesignResult }
  | { type: "error"; error: GetDesignErrorPayload };

export type GetDesignErrorPayload = {
  error: string;
  code?: string;
  reason?: string;
  retryWith?: {
    header: string;
    value: string;
  };
};

export class GetDesignError extends Error {
  readonly status: number;
  readonly payload: GetDesignErrorPayload;

  constructor(status: number, payload: GetDesignErrorPayload) {
    super(payload.reason ?? payload.error);
    this.name = "GetDesignError";
    this.status = status;
    this.payload = payload;
  }
}

export async function getDesign(
  url: string,
  options: GetDesignOptions = {},
): Promise<GetDesignResult> {
  const result = await executeDesign(url, options);
  return toGetDesignResult(result);
}

export async function* streamDesign(
  url: string,
  options: GetDesignOptions = {},
): AsyncGenerator<DesignStreamEvent, void, void> {
  const events: DesignStreamEvent[] = [];
  const result = await executeDesign(url, {
    ...options,
    onProgress: (event) => {
      events.push({ type: "progress", event: publicEvent(event) });
    },
  });

  for (const event of events) {
    yield event;
  }
  yield { type: "result", result: toGetDesignResult(result) };
}

type ExecuteDesignOptions = GetDesignOptions & {
  onProgress?: (event: RunDesignEvent) => void;
};

async function executeDesign(
  url: string,
  options: ExecuteDesignOptions,
): Promise<RunDesignResult> {
  const run = options.runDesign ?? runDesign;
  try {
    return await run(url, {
      siteName: options.siteName,
      credentials: options.credentials,
      visualRequirement: options.visualRequirement,
      installI18nFonts: options.installI18nFonts,
      measurementMode: options.measurementMode,
      onPhase: (event) => options.onProgress?.(event),
    });
  } catch (error) {
    if (error instanceof RunDesignError) {
      throw new GetDesignError(409, {
        error: "capture_failed",
        code: error.code,
        reason: error.message,
        retryWith: {
          header: "x-getdesign-mode",
          value: "text_only",
        },
      });
    }
    throw error;
  }
}

function toGetDesignResult(result: RunDesignResult): GetDesignResult {
  return {
    url: result.url,
    markdown: result.markdown,
    doc: result.doc,
    tokens: result.tokens,
    visualDescription: result.visualDescription,
    tiles: result.tiles,
    mode: result.mode,
  };
}

function publicEvent(event: RunDesignEvent): DesignProgressEvent {
  if (event.phase === "capture") {
    return {
      phase: "capture",
      capturePhase: event.event.phase,
      status: event.event.status,
      detail: event.event.detail,
      durationMs: event.event.durationMs,
    };
  }

  if (event.phase === "crawl") {
    return event.status === "start"
      ? { phase: "crawl", status: "start" }
      : {
          phase: "crawl",
          status: "ok",
          siteName: event.crawl.siteName,
          stylesheets: event.crawl.stylesheets.length,
        };
  }

  if (event.phase === "visual") {
    return event.status === "start"
      ? { phase: "visual", status: "start" }
      : { phase: "visual", status: "ok", visualStatus: event.visual.status };
  }

  if (event.phase === "describe") {
    return { phase: "describe", status: event.status, detail: event.detail };
  }

  if (event.phase === "extract") {
    return event.status === "start"
      ? { phase: "extract", status: "start" }
      : {
          phase: "extract",
          status: "ok",
          fontFamilies: event.tokens.typography.fontFamilies.length,
        };
  }

  if (event.phase === "synthesize") {
    return event.status === "start"
      ? { phase: "synthesize", status: "start" }
      : {
          phase: "synthesize",
          status: "ok",
          paletteGroups: event.doc.palette.groups.length,
        };
  }

  return event.status === "start"
    ? { phase: "render", status: "start" }
    : { phase: "render", status: "ok", markdownLength: event.markdown.length };
}

export default { getDesign, streamDesign, version };
