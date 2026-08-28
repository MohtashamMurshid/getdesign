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
      v.literal("completed"),
      v.literal("failed"),
    ),
    currentStep: v.optional(
      v.union(
        v.literal("crawl"),
        v.literal("capture"),
        v.literal("describe"),
        v.literal("extract"),
        v.literal("synthesize"),
        v.literal("render"),
      ),
    ),
    message: v.optional(v.string()),
    steps: v.object({
      crawl: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("ok"),
        v.literal("skipped"),
        v.literal("failed"),
      ),
      capture: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("ok"),
        v.literal("skipped"),
        v.literal("failed"),
      ),
      describe: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("ok"),
        v.literal("skipped"),
        v.literal("failed"),
      ),
      extract: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("ok"),
        v.literal("skipped"),
        v.literal("failed"),
      ),
      synthesize: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("ok"),
        v.literal("skipped"),
        v.literal("failed"),
      ),
      render: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("ok"),
        v.literal("skipped"),
        v.literal("failed"),
      ),
    }),
    mode: v.optional(v.union(v.literal("visual"), v.literal("text_only"))),
    tiles: v.optional(v.number()),
    markdownLength: v.optional(v.number()),
    rerunOf: v.optional(v.id("designRuns")),
    traceEvents: v.optional(v.array(v.any())),
    error: v.optional(
      v.object({
        code: v.optional(v.string()),
        message: v.string(),
        step: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_status", ["userId", "status"]),
  designRunArtifacts: defineTable({
    runId: v.id("designRuns"),
    kind: v.union(
      v.literal("crawl"),
      v.literal("visual"),
      v.literal("description"),
      v.literal("tokens"),
      v.literal("doc"),
      v.literal("markdown"),
    ),
    value: v.optional(v.any()),
    text: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    contentType: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_run", ["runId"])
    .index("by_run_kind", ["runId", "kind"]),
  userCredentials: defineTable({
    userId: v.string(),
    provider: v.union(v.literal("daytona"), v.literal("openai")),
    ciphertext: v.string(),
    iv: v.string(),
    keySuffix: v.string(),
    updatedAt: v.number(),
  }).index("by_user_and_provider", ["userId", "provider"]),
});
