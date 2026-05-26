import { NextResponse } from "next/server";
import { runExtractTokens } from "@getdesign/agent";
import { withAuth } from "@workos-inc/authkit-nextjs";

import {
  assertOwner,
  loadCrawl,
  loadState,
  saveTokens,
  updateStep,
} from "@/lib/runs-store";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const { id } = await params;

  try {
    await assertOwner(id, user.id);
    await updateStep(id, "extract", "running", "Extracting CSS tokens");
    const crawl = await loadCrawl(id);
    const tokens = runExtractTokens(crawl);
    await saveTokens(id, tokens);

    const run = await updateStep(
      id,
      "extract",
      "ok",
      `Extracted ${tokens.typography.fontFamilies.length} font families`,
    );

    return NextResponse.json({ run });
  } catch (error) {
    await markFailed(id, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extract failed." },
      { status: 500 },
    );
  }
}

async function markFailed(id: string, error: unknown) {
  try {
    await loadState(id);
    await updateStep(
      id,
      "extract",
      "failed",
      error instanceof Error ? error.message : "Extract failed.",
    );
  } catch {}
}
