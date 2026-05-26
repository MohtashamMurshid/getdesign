import { NextResponse } from "next/server";
import { renderDesignMd } from "@getdesign/tools/render";
import { withAuth } from "@workos-inc/authkit-nextjs";

import {
  assertOwner,
  loadDoc,
  loadState,
  saveMarkdown,
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
    await updateStep(id, "render", "running", "Rendering markdown");
    const doc = await loadDoc(id);
    const baseMarkdown = renderDesignMd(doc);
    const markdown =
      state.mode === "text_only" ? prependTextOnlyBanner(baseMarkdown) : baseMarkdown;

    await saveMarkdown(id, markdown);
    const run = await updateStep(id, "render", "ok", "Ready", {
      status: "completed",
      completedAt: Date.now(),
      markdownLength: markdown.length,
    });

    return NextResponse.json({ run });
  } catch (error) {
    await markFailed(id, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Render failed." },
      { status: 500 },
    );
  }
}

async function markFailed(id: string, error: unknown) {
  try {
    await loadState(id);
    await updateStep(
      id,
      "render",
      "failed",
      error instanceof Error ? error.message : "Render failed.",
    );
  } catch {}
}

function prependTextOnlyBanner(markdown: string) {
  const banner = [
    "> **Note:** This design.md was produced in text-only mode. The Daytona-based full landing page capture was unavailable for this run, so visual sections are derived from CSS tokens alone and may not reflect imagery, layout depth, or interaction polish from the live site.",
    "",
  ].join("\n");
  return `${banner}\n${markdown}`;
}
