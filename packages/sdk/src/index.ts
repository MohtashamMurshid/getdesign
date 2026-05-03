import type { DesignDoc, DesignTokens, RenderedDesignResult } from "@getdesign/types";

export const version = "0.0.1";
export type { DesignDoc, DesignTokens, RenderedDesignResult } from "@getdesign/types";

const DEFAULT_API_URL = "https://api.getdesign.app";

export type GetDesignCredentials = {
  daytonaApiKey?: string;
  openaiApiKey?: string;
};

export type VisualRequirement = "require" | "text_only_fallback";
export type FetchAdapter = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type GetDesignOptions = {
  /** Base URL for the getdesign API. Defaults to https://api.getdesign.app. */
  apiUrl?: string;
  /** Override the detected site name. */
  siteName?: string;
  /** Request-scoped credentials for BYOK runs. */
  credentials?: GetDesignCredentials;
  /** Continue with text-only output if visual capture is unavailable. */
  visualRequirement?: VisualRequirement;
  /** Injectable fetch for tests or custom runtimes. */
  fetch?: FetchAdapter;
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

function apiUrl(baseUrl: string | undefined, path: string): URL {
  return new URL(path, baseUrl ?? DEFAULT_API_URL);
}

function headers(options: GetDesignOptions): Headers {
  const headers = new Headers();
  const { credentials } = options;
  if (credentials?.daytonaApiKey) {
    headers.set("x-daytona-api-key", credentials.daytonaApiKey);
  }
  if (credentials?.openaiApiKey) {
    headers.set("x-openai-api-key", credentials.openaiApiKey);
  }
  if (options.siteName) {
    headers.set("x-getdesign-site-name", options.siteName);
  }
  if (options.visualRequirement === "text_only_fallback") {
    headers.set("x-getdesign-mode", "text_only");
  }
  return headers;
}

function addCommonParams(target: URL, url: string, options: GetDesignOptions): void {
  target.searchParams.set("url", url);
  if (options.siteName) target.searchParams.set("siteName", options.siteName);
}

async function parseError(res: Response): Promise<GetDesignError> {
  let payload: GetDesignErrorPayload;
  try {
    payload = (await res.json()) as GetDesignErrorPayload;
  } catch {
    payload = { error: res.statusText || "request_failed" };
  }
  return new GetDesignError(res.status, payload);
}

export async function getDesign(
  url: string,
  options: GetDesignOptions = {},
): Promise<GetDesignResult> {
  const fetchImpl = options.fetch ?? fetch;
  const target = apiUrl(options.apiUrl, "/v1/design");
  addCommonParams(target, url, options);
  target.searchParams.set("format", "json");

  const res = await fetchImpl(target, {
    method: "GET",
    headers: headers(options),
  });

  if (!res.ok) throw await parseError(res);
  return (await res.json()) as GetDesignResult;
}

export async function* streamDesign(
  url: string,
  options: GetDesignOptions = {},
): AsyncGenerator<DesignStreamEvent, void, void> {
  const fetchImpl = options.fetch ?? fetch;
  const target = apiUrl(options.apiUrl, "/v1/design/stream");
  addCommonParams(target, url, options);

  const res = await fetchImpl(target, {
    method: "GET",
    headers: headers(options),
  });

  if (!res.ok || !res.body) throw await parseError(res);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = parseSseEvent(rawEvent);
      if (event) yield event;
      boundary = buffer.indexOf("\n\n");
    }
  }
}

function parseSseEvent(raw: string): DesignStreamEvent | null {
  let eventName = "message";
  const data: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("event:")) eventName = line.slice("event:".length).trim();
    if (line.startsWith("data:")) data.push(line.slice("data:".length).trimStart());
  }

  if (data.length === 0) return null;
  const parsed = JSON.parse(data.join("\n")) as unknown;

  if (eventName === "progress") {
    return { type: "progress", event: parsed as DesignProgressEvent };
  }
  if (eventName === "result") {
    return { type: "result", result: parsed as GetDesignResult };
  }
  if (eventName === "error") {
    return { type: "error", error: parsed as GetDesignErrorPayload };
  }
  return null;
}

export default { getDesign, streamDesign, version };
