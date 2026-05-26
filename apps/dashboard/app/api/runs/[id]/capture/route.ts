import { NextResponse } from "next/server";
import { runVisual } from "@getdesign/agent";
import { withAuth } from "@workos-inc/authkit-nextjs";

import {
  assertOwner,
  loadCrawl,
  loadState,
  saveTilePngs,
  saveVisual,
  updateStep,
  type StoredVisual,
} from "@/lib/runs-store";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const { id } = await params;

  try {
    await assertOwner(id, user.id);
    const crawl = await loadCrawl(id);
    await updateStep(id, "capture", "running", "Capturing page");

    const visual = await runVisual(
      { url: crawl.sourceUrl },
      { daytonaApiKey: process.env.DAYTONA_API_KEY },
    );

    let stored: StoredVisual;
    if (visual.status === "captured") {
      const tiles = await saveTilePngs(id, visual.tiles);
      stored = {
        status: "captured",
        tiles,
        documentHeight: visual.documentHeight,
        documentWidth: visual.documentWidth,
        viewport: visual.viewport,
        measurementMode: visual.measurementMode,
        installedI18nFonts: visual.installedI18nFonts,
        durationsMs: visual.durationsMs,
      };
    } else {
      stored = {
        status: visual.status,
        reason: visual.reason,
        attempts: visual.status === "failed" ? visual.attempts : undefined,
        tiles: [],
      };
    }

    await saveVisual(id, stored);
    const run = await updateStep(
      id,
      "capture",
      stored.status === "captured" ? "ok" : "skipped",
      stored.status === "captured"
        ? `Captured ${stored.tiles.length} tiles`
        : (stored.reason ?? "Capture skipped"),
      {
        mode: stored.status === "captured" ? "visual" : "text_only",
        tiles: stored.tiles.length,
      },
    );

    return NextResponse.json({ run });
  } catch (error) {
    await markFailed(id, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Capture failed." },
      { status: 500 },
    );
  }
}

async function markFailed(id: string, error: unknown) {
  try {
    await loadState(id);
    await updateStep(
      id,
      "capture",
      "failed",
      error instanceof Error ? error.message : "Capture failed.",
    );
  } catch {}
}
