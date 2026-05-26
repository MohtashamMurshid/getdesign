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
import type { RunStep } from "@/lib/runs-store";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export const runtime = "nodejs";
export const maxDuration = 300;

const STEP_ORDER: RunStep[] = [
  "crawl",
  "capture",
  "describe",
  "extract",
  "synthesize",
  "render",
];

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

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const { id } = await params;
  const runId = id as Id<"designRuns">;
  const convex = getConvexClient();

  const run = await convex.query(api.designRuns.get, {
    id: runId,
    userId: user.id,
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  const nextStep = STEP_ORDER.find(
    (step) => run.steps[step] !== "ok" && run.steps[step] !== "skipped",
  );

  if (!nextStep || run.status === "completed") {
    return NextResponse.json({ ok: true });
  }

  try {
    await runFromStep({ convex, run, runId, userId: user.id, nextStep });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await convex.mutation(api.designRuns.failStep, {
      id: runId,
      userId: user.id,
      step: inferFailedStep(error, nextStep),
      message: error instanceof Error ? error.message : "Run failed.",
      code: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Run failed." },
      { status: 500 },
    );
  }
}

async function runFromStep({
  convex,
  run,
  runId,
  userId,
  nextStep,
}: {
  convex: ReturnType<typeof getConvexClient>;
  run: any;
  runId: Id<"designRuns">;
  userId: string;
  nextStep: RunStep;
}) {
  const artifacts = await convex.query(api.designRunArtifacts.getForRun, {
    runId,
    userId,
  });

  let crawl = await loadStoredJson<CrawlSiteResult>(artifacts.crawl);
  let visual = artifacts.visual as StoredVisual | null;
  let description = typeof artifacts.description === "string"
    ? artifacts.description
    : "";
  let tokens = artifacts.tokens as DesignTokens | null;
  let doc = artifacts.doc as DesignDoc | null;
  let mode = run.mode as "visual" | "text_only" | undefined;

  if (shouldRun(nextStep, "crawl")) {
    await beginStep(convex, runId, userId, "crawl", "Reading site");
    const crawled = await runCrawl({
      url: run.normalizedUrl,
      maxHtmlBytes: 5_000_000,
      maxStylesheetBytes: 1_000_000,
    });
    crawl = run.siteName?.trim()
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

  if (shouldRun(nextStep, "capture")) {
    if (!crawl) throw new StepError("crawl", "Crawl artifact missing.");
    if (!process.env.DAYTONA_API_KEY) {
      throw new StepError(
        "capture",
        "No Daytona API key available; set DAYTONA_API_KEY before starting a visual run.",
      );
    }
    await beginStep(convex, runId, userId, "capture", "Capturing page");
    const captured = await runVisual(
      { url: crawl.sourceUrl },
      { daytonaApiKey: process.env.DAYTONA_API_KEY },
    );
    visual = await storeVisual(convex, runId, userId, captured);
    mode = visual.status === "captured" ? "visual" : "text_only";
    await finishStep(
      convex,
      runId,
      userId,
      "capture",
      visual.status === "captured" ? "ok" : "skipped",
      visual.status === "captured"
        ? `Captured ${visual.tiles.length} tiles`
        : (visual.reason ?? "Capture skipped"),
      {
        mode,
        tiles: visual.tiles.length,
      },
    );
  }

  if (shouldRun(nextStep, "describe")) {
    if (!crawl) throw new StepError("crawl", "Crawl artifact missing.");
    if (!visual || visual.status !== "captured" || !visual.viewport) {
      description = "";
      await saveText(convex, runId, userId, "description", description);
      await finishStep(
        convex,
        runId,
        userId,
        "describe",
        "skipped",
        "No screenshots available",
      );
    } else {
      await beginStep(convex, runId, userId, "describe", "Describing screenshots");
      const tiles = await loadTileArtifacts(convex, runId, userId, visual);
      const result = await runDescribe({
        sourceUrl: crawl.sourceUrl,
        siteName: crawl.siteName,
        tiles,
        documentHeight: visual.documentHeight ?? visual.viewport.height,
        documentWidth: visual.documentWidth ?? visual.viewport.width,
        viewport: visual.viewport,
        model: resolveModel({ apiKey: process.env.OPENAI_API_KEY }),
      });
      description = result.description;
      await saveText(convex, runId, userId, "description", description);
      const wordCount = description.split(/\s+/).filter(Boolean).length;
      await finishStep(
        convex,
        runId,
        userId,
        "describe",
        "ok",
        `Described ${wordCount} words`,
      );
    }
  }

  if (shouldRun(nextStep, "extract")) {
    if (!crawl) throw new StepError("crawl", "Crawl artifact missing.");
    await beginStep(convex, runId, userId, "extract", "Extracting CSS tokens");
    tokens = runExtractTokens(crawl);
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

  if (shouldRun(nextStep, "synthesize")) {
    if (!crawl) throw new StepError("crawl", "Crawl artifact missing.");
    if (!tokens) throw new StepError("extract", "Token artifact missing.");
    await beginStep(convex, runId, userId, "synthesize", "Synthesizing design doc");
    const tiles = visual?.status === "captured"
      ? await loadTileArtifacts(convex, runId, userId, visual)
      : [];
    const result = await runSynthesize({
      sourceUrl: crawl.sourceUrl,
      siteName: crawl.siteName,
      tokens,
      tiles: tiles.length > 0 ? tiles : undefined,
      visualDescription: description.trim() || undefined,
      crawlNotes: crawl.notes,
      model: resolveModel({ apiKey: process.env.OPENAI_API_KEY }),
    });
    doc = result.doc;
    await saveValue(convex, runId, userId, "doc", doc);
    await finishStep(
      convex,
      runId,
      userId,
      "synthesize",
      "ok",
      `Synthesized ${doc.palette.groups.length} palette groups`,
    );
  }

  if (shouldRun(nextStep, "render")) {
    if (!doc) throw new StepError("synthesize", "Design doc artifact missing.");
    await beginStep(convex, runId, userId, "render", "Rendering markdown");
    const baseMarkdown = renderDesignMd(doc);
    const markdown =
      mode === "text_only" ? prependTextOnlyBanner(baseMarkdown) : baseMarkdown;
    await saveText(convex, runId, userId, "markdown", markdown);
    await finishStep(convex, runId, userId, "render", "ok", "Ready", {
      status: "completed",
      completedAt: Date.now(),
      markdownLength: markdown.length,
    });
  }
}

function shouldRun(nextStep: RunStep, step: RunStep) {
  return STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf(nextStep);
}

async function beginStep(
  convex: ReturnType<typeof getConvexClient>,
  id: Id<"designRuns">,
  userId: string,
  step: RunStep,
  message: string,
) {
  await convex.mutation(api.designRuns.beginStep, { id, userId, step, message });
}

async function finishStep(
  convex: ReturnType<typeof getConvexClient>,
  id: Id<"designRuns">,
  userId: string,
  step: RunStep,
  status: "ok" | "skipped",
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
  kind: "crawl" | "visual" | "tokens" | "doc",
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
  const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
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
  const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
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
      if (!response.ok) throw new Error(`Could not read stored tile ${tile.file}.`);
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

function prependTextOnlyBanner(markdown: string) {
  const banner = [
    "> **Note:** This design.md was produced in text-only mode. The Daytona-based full landing page capture was unavailable for this run, so visual sections are derived from CSS tokens alone and may not reflect imagery, layout depth, or interaction polish from the live site.",
    "",
  ].join("\n");
  return `${banner}\n${markdown}`;
}

class StepError extends Error {
  constructor(
    readonly step: RunStep,
    message: string,
  ) {
    super(message);
    this.name = "StepError";
  }
}

function inferFailedStep(error: unknown, fallback: RunStep): RunStep {
  if (error instanceof StepError) return error.step;
  return fallback;
}
