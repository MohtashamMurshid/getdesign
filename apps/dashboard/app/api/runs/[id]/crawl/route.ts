import { NextResponse } from "next/server";
import { runCrawl } from "@getdesign/agent";
import { withAuth } from "@workos-inc/authkit-nextjs";

import {
  assertOwner,
  loadState,
  saveCrawl,
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
    const state = await assertOwner(id, user.id);
    await updateStep(id, "crawl", "running", "Reading site");

    const crawled = await runCrawl({
      url: state.url,
      maxHtmlBytes: 5_000_000,
      maxStylesheetBytes: 1_000_000,
    });
    const crawl = state.siteName?.trim()
      ? { ...crawled, siteName: state.siteName.trim() }
      : crawled;

    await saveCrawl(id, crawl);
    const run = await updateStep(
      id,
      "crawl",
      "ok",
      `Crawled ${crawl.stylesheets.length} stylesheets`,
    );

    return NextResponse.json({ run });
  } catch (error) {
    await markFailed(id, "crawl", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Crawl failed." },
      { status: 500 },
    );
  }
}

async function markFailed(id: string, step: "crawl", error: unknown) {
  try {
    await loadState(id);
    await updateStep(
      id,
      step,
      "failed",
      error instanceof Error ? error.message : "Crawl failed.",
    );
  } catch {}
}
