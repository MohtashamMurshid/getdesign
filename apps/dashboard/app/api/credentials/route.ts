import { NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";

import { api } from "@convex/_generated/api";
import { getConvexClient } from "@/lib/convex-server";
import { encryptCredential, keySuffix } from "@/lib/credential-crypto";

export const runtime = "nodejs";

type Provider = "daytona" | "openai";

function isProvider(value: unknown): value is Provider {
  return value === "daytona" || value === "openai";
}

function readProvider(body: unknown): Provider | null {
  if (!body || typeof body !== "object") return null;
  const provider = (body as { provider?: unknown }).provider;
  return isProvider(provider) ? provider : null;
}

export async function POST(request: Request) {
  const { accessToken } = await withAuth({ ensureSignedIn: true });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const provider = readProvider(body);
  if (!provider) {
    return NextResponse.json(
      { error: "Provider must be daytona or openai." },
      { status: 400 },
    );
  }

  const key = (body as { key?: unknown }).key;
  if (typeof key !== "string" || !key.trim()) {
    return NextResponse.json({ error: "Key is required." }, { status: 400 });
  }

  const trimmed = key.trim();

  try {
    const { ciphertext, iv } = await encryptCredential(trimmed);
    const suffix = keySuffix(trimmed);
    const convex = getConvexClient(accessToken);
    await convex.mutation(api.userCredentials.upsertEncrypted, {
      provider,
      ciphertext,
      iv,
      keySuffix: suffix,
    });
    return NextResponse.json({
      ok: true,
      provider,
      keySuffix: suffix,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save key.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { accessToken } = await withAuth({ ensureSignedIn: true });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const provider = readProvider(body);
  if (!provider) {
    return NextResponse.json(
      { error: "Provider must be daytona or openai." },
      { status: 400 },
    );
  }

  const convex = getConvexClient(accessToken);
  const result = await convex.mutation(api.userCredentials.remove, {
    provider,
  });
  return NextResponse.json(result);
}
