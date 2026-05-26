import { NextResponse } from "next/server";
import { resolveModel, runDescribe } from "@getdesign/agent";
import { withAuth } from "@workos-inc/authkit-nextjs";

import {
  assertOwner,
  loadCrawl,
  loadState,
  loadTileArtifacts,
  loadVisual,
  saveDescription,
  updateStep,
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
    const visual = await loadVisual(id);

    if (visual.status !== "captured" || !visual.viewport) {
      await saveDescription(id, "");
      const run = await updateStep(
        id,
        "describe",
        "skipped",
        "No screenshots available",
      );
      return NextResponse.json({ run });
    }

    await updateStep(id, "describe", "running", "Describing screenshots");
    const [crawl, tiles] = await Promise.all([loadCrawl(id), loadTileArtifacts(id)]);

    const result = await runDescribe({
      sourceUrl: crawl.sourceUrl,
      siteName: crawl.siteName,
      tiles,
      documentHeight: visual.documentHeight ?? visual.viewport.height,
      documentWidth: visual.documentWidth ?? visual.viewport.width,
      viewport: visual.viewport,
      model: resolveModel({ apiKey: process.env.OPENAI_API_KEY }),
    });

    await saveDescription(id, result.description);
    const wordCount = result.description.split(/\s+/).filter(Boolean).length;
    const run = await updateStep(
      id,
      "describe",
      "ok",
      `Described ${wordCount} words`,
    );

    return NextResponse.json({ run });
  } catch (error) {
    await markFailed(id, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Describe failed." },
      { status: 500 },
    );
  }
}

async function markFailed(id: string, error: unknown) {
  try {
    await loadState(id);
    await updateStep(
      id,
      "describe",
      "failed",
      error instanceof Error ? error.message : "Describe failed.",
    );
  } catch {}
}
