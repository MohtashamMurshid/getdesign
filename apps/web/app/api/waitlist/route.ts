import { createHash } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { api } from "@convex/_generated/api";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL) env var. Set it in Vercel.",
    );
  }
  return new ConvexHttpClient(url);
}

function hashIp(ip: string): string {
  const salt = process.env.WAITLIST_IP_SALT ?? "getdesign";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}

function getIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: unknown;
      source?: unknown;
    };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const source = typeof body.source === "string" ? body.source : "web";
    const referer = req.headers.get("referer") ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const country = req.headers.get("x-vercel-ip-country") ?? undefined;
    const ip = getIp(req);
    const ipHash = ip ? hashIp(ip) : undefined;

    const client = getConvexClient();
    const result = await client.mutation(api.waitlist.join, {
      email,
      source,
      referer,
      userAgent,
      country,
      ipHash,
    });

    return NextResponse.json({ ok: true, duplicate: result.duplicate });
  } catch (err) {
    console.error("waitlist_signup_error", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 },
    );
  }
}
