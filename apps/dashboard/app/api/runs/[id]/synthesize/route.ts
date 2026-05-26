import { NextResponse } from "next/server";
import { resolveModel, runSynthesize } from "@getdesign/agent";
import { withAuth } from "@workos-inc/authkit-nextjs";

import {
  assertOwner,
  loadCrawl,
  loadDescription,
  loadState,
  loadTileArtifacts,
  loadTokens,
  saveDoc,
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
    await updateStep(id, "synthesize", "running", "Synthesizing design doc");

    const [crawl, tokens, tiles, description] = await Promise.all([
      loadCrawl(id),
      loadTokens(id),
      loadTileArtifacts(id),
      loadDescription(id).catch(() => ""),
    ]);

    const { doc } = await runSynthesize({
      sourceUrl: crawl.sourceUrl,
      siteName: crawl.siteName,
      tokens,
      tiles: tiles.length > 0 ? tiles : undefined,
      visualDescription: description.trim() || undefined,
      crawlNotes: crawl.notes,
      model: resolveModel({ apiKey: process.env.OPENAI_API_KEY }),
    });

    await saveDoc(id, doc);
    const run = await updateStep(
      id,
      "synthesize",
      "ok",
      `Synthesized ${doc.palette.groups.length} palette groups`,
    );

    return NextResponse.json({ run });
  } catch (error) {
    await markFailed(id, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Synthesis failed." },
      { status: 500 },
    );
  }
}

async function markFailed(id: string, error: unknown) {
  try {
    await loadState(id);
    await updateStep(
      id,
      "synthesize",
      "failed",
      error instanceof Error ? error.message : "Synthesis failed.",
    );
  } catch {}
}
