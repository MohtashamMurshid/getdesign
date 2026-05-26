import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";

import { assertOwner, runDir } from "@/lib/runs-store";

export const runtime = "nodejs";

const TEXT_ARTIFACTS: Record<string, string> = {
  "crawl.json": "application/json",
  "visual.json": "application/json",
  "tokens.json": "application/json",
  "doc.json": "application/json",
  "description.md": "text/markdown; charset=utf-8",
  "state.json": "application/json",
};

const TILE_PATTERN = /^tiles\/[0-9]{3}\.png$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; name: string[] }> },
) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const { id, name } = await params;

  const relative = name.join("/");

  const isTile = TILE_PATTERN.test(relative);
  const textType = TEXT_ARTIFACTS[relative];

  if (!isTile && !textType) {
    return NextResponse.json({ error: "Unknown artifact." }, { status: 404 });
  }

  try {
    await assertOwner(id, user.id);
  } catch {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  const dir = runDir(id);
  const filePath = path.join(dir, relative);

  if (!filePath.startsWith(`${dir}${path.sep}`)) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return NextResponse.json({ error: "Artifact not ready." }, { status: 404 });
  }

  if (!fileStat.isFile()) {
    return NextResponse.json({ error: "Not a file." }, { status: 404 });
  }

  const contentType = isTile ? "image/png" : textType;
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileStat.size),
      "Cache-Control": "no-store",
    },
  });
}
