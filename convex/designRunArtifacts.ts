import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

const artifactKindSchema = v.union(
  v.literal("crawl"),
  v.literal("visual"),
  v.literal("description"),
  v.literal("tokens"),
  v.literal("doc"),
  v.literal("markdown"),
);

async function assertOwnedRun(ctx: { db: any }, runId: any, userId: string) {
  const run = await ctx.db.get(runId);
  if (!run || run.userId !== userId || run.deletedAt) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Run not found.",
    });
  }
  return run;
}

export const getForRun = query({
  args: {
    runId: v.id("designRuns"),
    userId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await assertOwnedRun(ctx, args.runId, args.userId);
    const rows = await ctx.db
      .query("designRunArtifacts")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();

    const artifacts: Record<string, unknown> = {
      crawl: null,
      visual: null,
      description: null,
      tokens: null,
      doc: null,
      markdown: null,
    };

    for (const row of rows) {
      const storageUrl = row.storageId
        ? await ctx.storage.getUrl(row.storageId)
        : null;
      if (row.kind === "description" || row.kind === "markdown") {
        artifacts[row.kind] = row.text ?? storageUrl ?? null;
      } else {
        artifacts[row.kind] =
          row.value && storageUrl
            ? { ...row.value, __storageUrl: storageUrl }
            : (row.value ?? (storageUrl ? { __storageUrl: storageUrl } : null));
      }
    }

    return artifacts;
  },
});

export const getTileUrls = query({
  args: {
    runId: v.id("designRuns"),
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      file: v.string(),
      width: v.number(),
      height: v.number(),
      url: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    await assertOwnedRun(ctx, args.runId, args.userId);
    const visual = await ctx.db
      .query("designRunArtifacts")
      .withIndex("by_run_kind", (q) =>
        q.eq("runId", args.runId).eq("kind", "visual"),
      )
      .unique();

    const tiles = visual?.value?.tiles;
    if (!Array.isArray(tiles)) return [];

    const withUrls = await Promise.all(
      tiles.map(async (tile) => {
        const storageId = tile.storageId;
        if (!storageId) return null;
        const url = await ctx.storage.getUrl(storageId);
        if (!url) return null;
        return {
          file: String(tile.file),
          width: Number(tile.width),
          height: Number(tile.height),
          url,
        };
      }),
    );

    return withUrls.filter((tile): tile is NonNullable<typeof tile> => tile !== null);
  },
});

export const generateUploadUrl = mutation({
  args: {
    runId: v.id("designRuns"),
    userId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    await assertOwnedRun(ctx, args.runId, args.userId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const upsertValue = mutation({
  args: {
    runId: v.id("designRuns"),
    userId: v.string(),
    kind: artifactKindSchema,
    value: v.optional(v.any()),
    text: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    contentType: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await assertOwnedRun(ctx, args.runId, args.userId);
    const now = Date.now();
    const existing = await ctx.db
      .query("designRunArtifacts")
      .withIndex("by_run_kind", (q) =>
        q.eq("runId", args.runId).eq("kind", args.kind),
      )
      .unique();

    const patch: {
      value?: unknown;
      text?: string;
      storageId?: typeof args.storageId;
      contentType?: string;
      updatedAt: number;
    } = { updatedAt: now };
    if (args.value !== undefined) patch.value = args.value;
    if (args.text !== undefined) patch.text = args.text;
    if (args.storageId !== undefined) patch.storageId = args.storageId;
    if (args.contentType !== undefined) patch.contentType = args.contentType;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return null;
    }

    await ctx.db.insert("designRunArtifacts", {
      runId: args.runId,
      kind: args.kind,
      ...patch,
      createdAt: now,
    });
    return null;
  },
});
