import { runReceipt } from "@getdesign/analytics/lifecycle";
import { NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import {
  resolveModel,
  runCrawl,
  runDescribe,
  runExtractTokens,
  runSynthesize,
  runVisual,
  type VisualResult,
} from "@getdesign/agent";
import { renderDesignMd } from "@getdesign/tools/render";
import type { CrawlSiteResult } from "@getdesign/tools";
import type { ScreenshotArtifact } from "@getdesign/tools/daytona";
import type { DesignDoc, DesignTokens } from "@getdesign/types";

import { getConvexClient } from "@/lib/convex-server";
import { captureFailureMessage } from "@/lib/capture-policy";
import {
  requireDaytonaCredential,
  requireOpenAiCredential,
  resolveRunCredentials,
} from "@/lib/run-credentials";
import type { RunStep } from "@/lib/runs-store";
import { prependTextOnlyBanner } from "@/lib/text-only-banner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

type StepStatus = "ok" | "skipped";

type StoredRun = {
  normalizedUrl: string;
  siteName?: string;
  mode?: "visual" | "text_only";
  steps: Record<RunStep, "pending" | "running" | "ok" | "skipped" | "failed">;
};

type StoredVisual = {
  status: "captured" | "skipped" | "failed";
  reason?: string;
  attempts?: number;
  tiles: Array<{
    file: string;
    width: number;
    height: number;
    format: "png";
    storageId?: Id<"_storage">;
    url?: string;
  }>;
  documentHeight?: number;
  documentWidth?: number;
  viewport?: { width: number; height: number };
  measurementMode?: string;
  installedI18nFonts?: boolean;
  durationsMs?: unknown;
};

type RunContext = {
  convex: ReturnType<typeof getConvexClient>;
  run: StoredRun;
  runId: Id<"designRuns">;
  userId: string;
  artifacts: Record<string, unknown>;
};

export function runStepHandler(step: RunStep) {
  return async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { accessToken, user } = await withAuth({ ensureSignedIn: true });
    const { id } = await params;
    const runId = id as Id<"designRuns">;
    const convex = getConvexClient(accessToken);

    const run = await convex.query(api.designRuns.get, {
      id: runId,
      userId: user.id,
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found." }, { status: 404 });
    }

    const status = run.steps[step];
    if (status === "ok" || status === "skipped") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const artifacts = await convex.query(api.designRunArtifacts.getForRun, {
      runId,
      userId: user.id,
    });

    try {
      await runStep(step, {
        convex,
        run,
        runId,
        userId: user.id,
        artifacts,
      });
      const persisted = await convex.query(api.designRuns.get, { id: runId, userId: user.id }).catch(() => null);
      return NextResponse.json({ ok: true, analytics: persisted ? runReceipt(persisted, run.startedAt) : undefined });
    } catch (error) {
      await convex.mutation(api.designRuns.failStep, {
        id: runId,
        userId: user.id,
        step: inferFailedStep(error, step),
        message: error instanceof Error ? error.message : "Run failed.",
        code: inferErrorCode(error),
      });
      const persisted = await convex.query(api.designRuns.get, { id: runId, userId: user.id }).catch(() => null);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Run failed.", analytics: persisted ? runReceipt(persisted, run.startedAt) : undefined },
        { status: 500 },
      );
    }
  };
}

async function runStep(step: RunStep, context: RunContext) {
  switch (step) {
    case "crawl":
      return await runCrawlStep(context);
    case "capture":
      return await runCaptureStep(context);
    case "extract":
      return await runExtractStep(context);
    case "describe":
      return await runDescribeStep(context);
    case "synthesize":
      return await runSynthesizeStep(context);
    case "render":
      return await runRenderStep(context);
  }
}

async function runCrawlStep({ convex, run, runId, userId }: RunContext) {
  await beginStep(convex, runId, userId, "crawl", "Reading site");
  const crawled = await runCrawl({
    url: run.normalizedUrl,
    maxHtmlBytes: 5_000_000,
    maxStylesheetBytes: 1_000_000,
  });
  const crawl = run.siteName?.trim()
    ? { ...crawled, siteName: run.siteName.trim() }
    : crawled;
  await saveCrawl(convex, runId, userId, crawl);
  await finishStep(
    convex,
    runId,
    userId,
    "crawl",
    "ok",
    `Crawled ${crawl.stylesheets.length} stylesheets`,
  );
}

async function runCaptureStep({
  convex,
  runId,
  userId,
  artifacts,
}: RunContext) {
  const crawl = await requireCrawl(artifacts);
  let daytonaApiKey: string;
  try {
    const credentials = await resolveRunCredentials(convex);
    daytonaApiKey = requireDaytonaCredential(credentials);
  } catch (error) {
    throw new StepError(
      "capture",
      error instanceof Error
        ? error.message
        : "Daytona credential unavailable.",
      "capture_failed",
    );
  }

  await beginStep(convex, runId, userId, "capture", "Capturing page");
  let captured: VisualResult;
  try {
    captured = await runVisual({ url: crawl.sourceUrl }, { daytonaApiKey });
  } catch (error) {
    throw new StepError(
      "capture",
      error instanceof Error ? error.message : "Visual capture failed.",
      "capture_failed",
    );
  }
  const captureFailure = captureFailureMessage(captured);
  if (captureFailure) {
    throw new StepError("capture", captureFailure, "capture_failed");
  }
  const visual = await storeVisual(convex, runId, userId, captured);
  await finishStep(
    convex,
    runId,
    userId,
    "capture",
    "ok",
    `Captured ${visual.tiles.length} tiles`,
    {
      mode: "visual",
      tiles: visual.tiles.length,
    },
  );
}

async function runExtractStep({
  convex,
  runId,
  userId,
  artifacts,
}: RunContext) {
  const crawl = await requireCrawl(artifacts);
  await beginStep(convex, runId, userId, "extract", "Extracting CSS tokens");
  const tokens = runExtractTokens(crawl);
  await saveValue(convex, runId, userId, "tokens", tokens);
  await finishStep(
    convex,
    runId,
    userId,
    "extract",
    "ok",
    `Extracted ${tokens.typography.fontFamilies.length} font families`,
  );
}

async function runDescribeStep({
  convex,
  runId,
  userId,
  artifacts,
}: RunContext) {
  const crawl = await requireCrawl(artifacts);
  const visual = artifacts.visual as StoredVisual | null;

  if (!visual || visual.status !== "captured" || !visual.viewport) {
    await saveText(convex, runId, userId, "description", "");
    await finishStep(
      convex,
      runId,
      userId,
      "describe",
      "skipped",
      "No screenshots available",
    );
    return;
  }

  const credentials = await resolveRunCredentials(convex);
  const openaiApiKey = requireOpenAiCredential(credentials);
  await beginStep(convex, runId, userId, "describe", "Describing screenshots");
  const tiles = await loadTileArtifacts(convex, runId, userId, visual);
  const result = await runDescribe({
    sourceUrl: crawl.sourceUrl,
    siteName: crawl.siteName,
    tiles,
    documentHeight: visual.documentHeight ?? visual.viewport.height,
    documentWidth: visual.documentWidth ?? visual.viewport.width,
    viewport: visual.viewport,
    model: resolveModel({ apiKey: openaiApiKey }),
  });
  await saveText(convex, runId, userId, "description", result.description);
  const wordCount = result.description.split(/\s+/).filter(Boolean).length;
  await finishStep(
    convex,
    runId,
    userId,
    "describe",
    "ok",
    `Described ${wordCount} words`,
  );
}

async function runSynthesizeStep({
  convex,
  runId,
  userId,
  artifacts,
}: RunContext) {
  const crawl = await requireCrawl(artifacts);
  const tokens = artifacts.tokens as DesignTokens | null;
  if (!tokens) throw new StepError("extract", "Token artifact missing.");

  const visual = artifacts.visual as StoredVisual | null;
  const description =
    typeof artifacts.description === "string" ? artifacts.description : "";
  const credentials = await resolveRunCredentials(convex);
  const openaiApiKey = requireOpenAiCredential(credentials);
  await beginStep(
    convex,
    runId,
    userId,
    "synthesize",
    "Synthesizing design doc",
  );
  const tiles =
    visual?.status === "captured"
      ? await loadTileArtifacts(convex, runId, userId, visual)
      : [];
  const result = await runSynthesize({
    sourceUrl: crawl.sourceUrl,
    siteName: crawl.siteName,
    tokens,
    tiles: tiles.length > 0 ? tiles : undefined,
    visualDescription: description.trim() || undefined,
    crawlNotes: crawl.notes,
    model: resolveModel({ apiKey: openaiApiKey }),
  });
  await saveValue(convex, runId, userId, "doc", result.doc);
  await finishStep(
    convex,
    runId,
    userId,
    "synthesize",
    "ok",
    `Synthesized ${result.doc.palette.groups.length} palette groups`,
  );
}

async function runRenderStep({
  convex,
  run,
  runId,
  userId,
  artifacts,
}: RunContext) {
  const doc = artifacts.doc as DesignDoc | null;
  if (!doc) throw new StepError("synthesize", "Design doc artifact missing.");

  await beginStep(convex, runId, userId, "render", "Rendering markdown");
  const baseMarkdown = renderDesignMd(doc);
  const markdown =
    run.mode === "text_only"
      ? prependTextOnlyBanner(baseMarkdown)
      : baseMarkdown;
  await saveText(convex, runId, userId, "markdown", markdown);
  await finishStep(convex, runId, userId, "render", "ok", "Ready", {
    status: "completed",
    completedAt: Date.now(),
    markdownLength: markdown.length,
  });
}

async function requireCrawl(
  artifacts: Record<string, unknown>,
): Promise<CrawlSiteResult> {
  const crawl = await loadStoredJson<CrawlSiteResult>(artifacts.crawl);
  if (!crawl) throw new StepError("crawl", "Crawl artifact missing.");
  return crawl;
}

async function beginStep(
  convex: ReturnType<typeof getConvexClient>,
  id: Id<"designRuns">,
  userId: string,
  step: RunStep,
  message: string,
) {
  await convex.mutation(api.designRuns.beginStep, {
    id,
    userId,
    step,
    message,
  });
}

async function finishStep(
  convex: ReturnType<typeof getConvexClient>,
  id: Id<"designRuns">,
  userId: string,
  step: RunStep,
  status: StepStatus,
  message: string,
  patch?: {
    status?: "queued" | "running" | "completed" | "failed";
    mode?: "visual" | "text_only";
    tiles?: number;
    markdownLength?: number;
    completedAt?: number;
  },
) {
  await convex.mutation(api.designRuns.finishStep, {
    id,
    userId,
    step,
    status,
    message,
    patch,
  });
}

async function saveValue(
  convex: ReturnType<typeof getConvexClient>,
  runId: Id<"designRuns">,
  userId: string,
  kind: "visual" | "tokens" | "doc",
  value: unknown,
) {
  await convex.mutation(api.designRunArtifacts.upsertValue, {
    runId,
    userId,
    kind,
    value,
  });
}

async function saveCrawl(
  convex: ReturnType<typeof getConvexClient>,
  runId: Id<"designRuns">,
  userId: string,
  crawl: CrawlSiteResult,
) {
  const storageId = await uploadJson(convex, runId, userId, crawl);
  await convex.mutation(api.designRunArtifacts.upsertValue, {
    runId,
    userId,
    kind: "crawl",
    value: summarizeCrawl(crawl),
    storageId,
    contentType: "application/json",
  });
}

async function saveText(
  convex: ReturnType<typeof getConvexClient>,
  runId: Id<"designRuns">,
  userId: string,
  kind: "description" | "markdown",
  text: string,
) {
  await convex.mutation(api.designRunArtifacts.upsertValue, {
    runId,
    userId,
    kind,
    text,
    contentType: "text/markdown; charset=utf-8",
  });
}

async function storeVisual(
  convex: ReturnType<typeof getConvexClient>,
  runId: Id<"designRuns">,
  userId: string,
  visual: VisualResult,
): Promise<StoredVisual> {
  if (visual.status !== "captured") {
    const stored: StoredVisual = {
      status: visual.status,
      reason: visual.reason,
      attempts: visual.status === "failed" ? visual.attempts : undefined,
      tiles: [],
    };
    await saveValue(convex, runId, userId, "visual", stored);
    return stored;
  }

  const tiles = await Promise.all(
    visual.tiles.map(async (tile, index) => {
      const storageId = await uploadPng(convex, runId, userId, tile.pngBase64);
      return {
        file: `${String(index).padStart(3, "0")}.png`,
        width: tile.width,
        height: tile.height,
        format: "png" as const,
        storageId,
      };
    }),
  );

  const stored: StoredVisual = {
    status: "captured",
    tiles,
    documentHeight: visual.documentHeight,
    documentWidth: visual.documentWidth,
    viewport: visual.viewport,
    measurementMode: visual.measurementMode,
    installedI18nFonts: visual.installedI18nFonts,
    durationsMs: visual.durationsMs,
  };
  await saveValue(convex, runId, userId, "visual", stored);
  return stored;
}

async function uploadPng(
  convex: ReturnType<typeof getConvexClient>,
  runId: Id<"designRuns">,
  userId: string,
  pngBase64: string,
): Promise<Id<"_storage">> {
  const uploadUrl = await convex.mutation(
    api.designRunArtifacts.generateUploadUrl,
    { runId, userId },
  );
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: Buffer.from(pngBase64, "base64"),
  });
  if (!response.ok) {
    throw new Error("Failed to upload screenshot tile.");
  }
  const { storageId } = (await response.json()) as {
    storageId: Id<"_storage">;
  };
  return storageId;
}

async function uploadJson(
  convex: ReturnType<typeof getConvexClient>,
  runId: Id<"designRuns">,
  userId: string,
  value: unknown,
): Promise<Id<"_storage">> {
  const uploadUrl = await convex.mutation(
    api.designRunArtifacts.generateUploadUrl,
    { runId, userId },
  );
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!response.ok) {
    throw new Error("Failed to upload run artifact.");
  }
  const { storageId } = (await response.json()) as {
    storageId: Id<"_storage">;
  };
  return storageId;
}

async function loadStoredJson<T>(value: unknown): Promise<T | null> {
  if (!value || typeof value !== "object") return null;
  const storageUrl = (value as { __storageUrl?: unknown }).__storageUrl;
  if (typeof storageUrl !== "string") return value as T;
  const response = await fetch(storageUrl);
  if (!response.ok) throw new Error("Could not read stored run artifact.");
  return (await response.json()) as T;
}

function summarizeCrawl(crawl: CrawlSiteResult) {
  return {
    sourceUrl: crawl.sourceUrl,
    siteName: crawl.siteName,
    sourceUrls: crawl.sourceUrls,
    notes: crawl.notes,
    stylesheets: crawl.stylesheets.map((stylesheet) => ({
      kind: stylesheet.kind,
      source: stylesheet.source,
      url: stylesheet.url,
      importedFrom: stylesheet.importedFrom,
      contentLength: stylesheet.content.length,
    })),
  };
}

async function loadTileArtifacts(
  convex: ReturnType<typeof getConvexClient>,
  runId: Id<"designRuns">,
  userId: string,
  visual: StoredVisual,
): Promise<ScreenshotArtifact[]> {
  const tileUrls = await convex.query(api.designRunArtifacts.getTileUrls, {
    runId,
    userId,
  });
  return await Promise.all(
    visual.tiles.map(async (tile, index) => {
      const url = tile.url ?? tileUrls[index]?.url;
      if (!url) throw new Error(`Missing stored tile ${tile.file}.`);
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Could not read stored tile ${tile.file}.`);
      const arrayBuffer = await response.arrayBuffer();
      return {
        imageBase64: Buffer.from(arrayBuffer).toString("base64"),
        width: tile.width,
        height: tile.height,
        format: tile.format,
      };
    }),
  );
}

class StepError extends Error {
  constructor(
    readonly step: RunStep,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = code ?? "StepError";
  }
}

function inferFailedStep(error: unknown, fallback: RunStep): RunStep {
  if (error instanceof StepError) return error.step;
  return fallback;
}

function inferErrorCode(error: unknown): string | undefined {
  if (error instanceof StepError) return error.code ?? error.name;
  if (error instanceof Error) return error.name;
  return undefined;
}
