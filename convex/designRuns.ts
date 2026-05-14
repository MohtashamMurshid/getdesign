import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

const phaseSchema = v.union(
  v.literal("crawl"),
  v.literal("capture"),
  v.literal("visual"),
  v.literal("describe"),
  v.literal("extract"),
  v.literal("synthesize"),
  v.literal("render"),
);

function normalizeUrl(input: string) {
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
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

export const create = mutation({
  args: {
    userId: v.string(),
    userEmail: v.optional(v.string()),
    url: v.string(),
    rerunOf: v.optional(v.id("designRuns")),
  },
  handler: async (ctx, args) => {
    const normalizedUrl = normalizeUrl(args.url);
    const domain = domainFromUrl(normalizedUrl);
    const now = Date.now();

    return await ctx.db.insert("designRuns", {
      userId: args.userId,
      userEmail: args.userEmail,
      url: args.url,
      normalizedUrl,
      domain,
      slug: slugFromDomain(domain),
      status: "queued",
      latestMessage: "Queued",
      rerunOf: args.rerunOf,
      traceEvents: [
        {
          phase: "queued",
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

export const listForUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 24 }) => {
    const rows = await ctx.db
      .query("designRuns")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return rows.filter((run) => !run.deletedAt);
  },
});

export const getForUser = query({
  args: {
    id: v.id("designRuns"),
    userId: v.string(),
  },
  handler: async (ctx, { id, userId }) => {
    const run = await ctx.db.get(id);
    if (!run || run.userId !== userId || run.deletedAt) return null;
    return run;
  },
});

export const markDeleted = mutation({
  args: {
    id: v.id("designRuns"),
    userId: v.string(),
  },
  handler: async (ctx, { id, userId }) => {
    const run = await ctx.db.get(id);
    if (!run || run.userId !== userId) return { ok: false };
    await ctx.db.patch(id, { deletedAt: Date.now(), updatedAt: Date.now() });
    return { ok: true };
  },
});

export const appendProgress = mutation({
  args: {
    id: v.id("designRuns"),
    status: v.optional(
      v.union(
        v.literal("queued"),
        v.literal("running"),
        v.literal("needs_action"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("canceled"),
      ),
    ),
    currentPhase: v.optional(phaseSchema),
    currentPhaseStatus: v.optional(v.string()),
    latestMessage: v.optional(v.string()),
    event: v.any(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) return;

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: args.status ?? run.status,
      currentPhase: args.currentPhase ?? run.currentPhase,
      currentPhaseStatus: args.currentPhaseStatus ?? run.currentPhaseStatus,
      latestMessage: args.latestMessage ?? run.latestMessage,
      traceEvents: [...(run.traceEvents ?? []), { ...args.event, at: now }],
      startedAt:
        run.startedAt ?? (args.status === "running" ? now : undefined),
      updatedAt: now,
    });
  },
});

export const complete = mutation({
  args: {
    id: v.id("designRuns"),
    markdown: v.string(),
    doc: v.any(),
    tokens: v.any(),
    visualDescription: v.optional(v.string()),
    mode: v.union(v.literal("visual"), v.literal("text_only")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "completed",
      currentPhase: "render",
      currentPhaseStatus: "ok",
      latestMessage: "Ready",
      markdown: args.markdown,
      doc: args.doc,
      tokens: args.tokens,
      visualDescription: args.visualDescription,
      mode: args.mode,
      completedAt: now,
      updatedAt: now,
    });
  },
});

export const start = action({
  args: {
    id: v.id("designRuns"),
    userId: v.string(),
  },
  handler: async (ctx, { id }) => {
    await ctx.runMutation(api.designRuns.appendProgress, {
      id,
      status: "running",
      currentPhase: "crawl",
      currentPhaseStatus: "start",
      latestMessage: "Crawling",
      event: { phase: "crawl", status: "start" },
    });

    // The production action should call @getdesign/sdk streamDesign here and
    // persist each progress event. Keeping this action lightweight lets the UI
    // and data contract land before provider credentials are wired into Convex.
  },
});
