import { NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";

import { getConvexClient } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export const runtime = "nodejs";

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

  if (run.status === "completed") {
    return NextResponse.json(
      { error: "Run already completed." },
      { status: 409 },
    );
  }

  if (run.steps.capture === "ok") {
    return NextResponse.json(
      { error: "Visual capture already succeeded." },
      { status: 409 },
    );
  }

  try {
    await convex.mutation(api.designRuns.resumeTextOnly, {
      id: runId,
      userId: user.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not continue as text-only.";
    if (/already completed|already succeeded/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
