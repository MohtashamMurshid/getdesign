import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  textOnlyResumePatch,
  textOnlyResumeRejection,
} from "./designRunPolicy";
import { requireWorkOsUserId } from "./workosAuth";

const stepSchema = v.union(
  v.literal("crawl"),
  v.literal("capture"),
  v.literal("describe"),
  v.literal("extract"),
  v.literal("synthesize"),
  v.literal("render"),
);

const stepStatusSchema = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("ok"),
  v.literal("skipped"),
  v.literal("failed"),
);

const runStatusSchema = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
);

function normalizeUrl(input: string) {
  const withProtocol = /^https?:\/\//i.test(input.trim())
    ? input.trim()
    : `https://${input.trim()}`;
  const url = new URL(withProtocol);
  url.hash = "";
  return url.toString();
}

function domainFromUrl(input: string) {
  return new URL(input).hostname.replace(/^www\./, "");
}

function slugFromDomain(domain: string) {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function initialSteps() {
  return {
    crawl: "pending" as const,
    capture: "pending" as const,
    describe: "pending" as const,
    extract: "pending" as const,
    synthesize: "pending" as const,
    render: "pending" as const,
  };
}

async function getOwnedRun(ctx: { db: any }, id: any, userId: string) {
  const run = await ctx.db.get(id);
  if (!run || run.userId !== userId || run.deletedAt) return null;
  return run;
}

export const create = mutation({
  args: {
    userId: v.string(),
    userEmail: v.optional(v.string()),
    url: v.string(),
    siteName: v.optional(v.string()),
    rerunOf: v.optional(v.id("designRuns")),
  },
  returns: v.id("designRuns"),
  handler: async (ctx, args) => {
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(args.url);
    } catch {
      throw new ConvexError({
        code: "INVALID_URL",
        message: "Enter a public URL.",
      });
    }

    const domain = domainFromUrl(normalizedUrl);
    const now = Date.now();

    return await ctx.db.insert("designRuns", {
      userId: args.userId,
      userEmail: args.userEmail,
      url: normalizedUrl,
      normalizedUrl,
      domain,
      slug: slugFromDomain(domain),
      status: "queued",
      message: "Queued",
      steps: initialSteps(),
      rerunOf: args.rerunOf,
      traceEvents: [
        {
          step: "queued",
          status: "ok",
          message: "Run created",
          at: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const get = query({
  args: {
    id: v.id("designRuns"),
    userId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, { id, userId }) => {
    return await getOwnedRun(ctx, id, userId);
  },
});

export const listRecent = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, { userId, limit = 24 }) => {
    const rows = await ctx.db
      .query("designRuns")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return rows.filter((run) => !run.deletedAt);
  },
});

export const markDeleted = mutation({
  args: {
    id: v.id("designRuns"),
    userId: v.string(),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, { id, userId }) => {
    const run = await getOwnedRun(ctx, id, userId);
    if (!run) return { ok: false };
    await ctx.db.patch(id, { deletedAt: Date.now(), updatedAt: Date.now() });
    return { ok: true };
  },
});

export const beginStep = mutation({
  args: {
    id: v.id("designRuns"),
    userId: v.string(),
    step: stepSchema,
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await getOwnedRun(ctx, args.id, args.userId);
    if (!run) throw new ConvexError("Run not found.");
    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "running",
      currentStep: args.step,
      message: args.message,
      error: undefined,
      steps: { ...run.steps, [args.step]: "running" },
      traceEvents: [
        ...(run.traceEvents ?? []),
        { step: args.step, status: "running", message: args.message, at: now },
      ],
      startedAt: run.startedAt ?? now,
      updatedAt: now,
    });
    return null;
  },
});

export const finishStep = mutation({
  args: {
    id: v.id("designRuns"),
    userId: v.string(),
    step: stepSchema,
    status: v.union(v.literal("ok"), v.literal("skipped")),
    message: v.string(),
    patch: v.optional(
      v.object({
        status: v.optional(runStatusSchema),
        mode: v.optional(v.union(v.literal("visual"), v.literal("text_only"))),
        tiles: v.optional(v.number()),
        markdownLength: v.optional(v.number()),
        completedAt: v.optional(v.number()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await getOwnedRun(ctx, args.id, args.userId);
    if (!run) throw new ConvexError("Run not found.");
    const now = Date.now();
    const nextStatus = args.patch?.status ?? run.status;

    await ctx.db.patch(args.id, {
      ...args.patch,
      status: nextStatus,
      currentStep: args.step,
      message: args.message,
      steps: { ...run.steps, [args.step]: args.status },
      traceEvents: [
        ...(run.traceEvents ?? []),
        {
          step: args.step,
          status: args.status,
          message: args.message,
          at: now,
        },
      ],
      updatedAt: now,
    });
    return null;
  },
});

export const failStep = mutation({
  args: {
    id: v.id("designRuns"),
    userId: v.string(),
    step: stepSchema,
    message: v.string(),
    code: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await getOwnedRun(ctx, args.id, args.userId);
    if (!run) return null;
    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "failed",
      currentStep: args.step,
      message: args.message,
      error: {
        code: args.code,
        message: args.message,
        step: args.step,
      },
      steps: { ...run.steps, [args.step]: "failed" },
      traceEvents: [
        ...(run.traceEvents ?? []),
        { step: args.step, status: "failed", message: args.message, at: now },
      ],
      failedAt: now,
      updatedAt: now,
    });
    return null;
  },
});

export const resumeTextOnly = mutation({
  args: {
    id: v.id("designRuns"),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const userId = await requireWorkOsUserId(ctx);
    const run = await getOwnedRun(ctx, args.id, userId);
    if (!run) throw new ConvexError("Run not found.");
    const rejection = textOnlyResumeRejection(run);
    if (rejection) throw new ConvexError(rejection);

    const now = Date.now();
    await ctx.db.patch(args.id, textOnlyResumePatch(run, now));
    return { ok: true as const };
  },
});
