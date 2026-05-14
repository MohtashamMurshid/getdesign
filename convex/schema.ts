import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  waitlist: defineTable({
    email: v.string(),
    source: v.optional(v.string()),
    referer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipHash: v.optional(v.string()),
    country: v.optional(v.string()),
  })
    .index("by_email", ["email"]),
  designRuns: defineTable({
    userId: v.string(),
    userEmail: v.optional(v.string()),
    url: v.string(),
    normalizedUrl: v.string(),
    domain: v.string(),
    slug: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("needs_action"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("canceled"),
    ),
    currentPhase: v.optional(
      v.union(
        v.literal("crawl"),
        v.literal("capture"),
        v.literal("visual"),
        v.literal("describe"),
        v.literal("extract"),
        v.literal("synthesize"),
        v.literal("render"),
      ),
    ),
    currentPhaseStatus: v.optional(v.string()),
    latestMessage: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("visual"), v.literal("text_only"))),
    rerunOf: v.optional(v.id("designRuns")),
    progressSummary: v.optional(v.any()),
    traceEvents: v.optional(v.array(v.any())),
    markdown: v.optional(v.string()),
    doc: v.optional(v.any()),
    tokens: v.optional(v.any()),
    visualDescription: v.optional(v.string()),
    screenshotFileId: v.optional(v.id("_storage")),
    tileFileIds: v.optional(v.array(v.id("_storage"))),
    error: v.optional(
      v.object({
        code: v.optional(v.string()),
        message: v.string(),
        phase: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_status", ["userId", "status"]),
});
