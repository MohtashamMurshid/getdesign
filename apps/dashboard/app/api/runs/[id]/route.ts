import { NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";

import { assertOwner } from "@/lib/runs-store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const { id } = await params;

  try {
    const run = await assertOwner(id, user.id);
    return NextResponse.json({ run });
  } catch {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }
}
