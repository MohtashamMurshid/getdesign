import { NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";

import { createRun, createRunId } from "@/lib/runs-store";

export const runtime = "nodejs";

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withProtocol);
  url.hash = "";
  return url.toString();
}

export async function POST(request: Request) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const body = (await request.json()) as { url?: string; siteName?: string };

  if (!body.url) {
    return NextResponse.json({ error: "Missing URL." }, { status: 400 });
  }

  let url: string;
  try {
    url = normalizeUrl(body.url);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  const run = await createRun({
    id: createRunId(url),
    url,
    siteName: body.siteName?.trim() || undefined,
    userId: user.id,
    userEmail: user.email ?? undefined,
  });

  return NextResponse.json({ run });
}
