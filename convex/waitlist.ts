import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const join = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
    referer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipHash: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new Error("Invalid email");
    }

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      return { ok: true as const, duplicate: true as const, id: existing._id };
    }

    const id = await ctx.db.insert("waitlist", { ...args, email });
    return { ok: true as const, duplicate: false as const, id };
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    // Small table, fine to collect; swap for a counter doc if this grows.
    const rows = await ctx.db.query("waitlist").collect();
    return rows.length;
  },
});

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    return await ctx.db.query("waitlist").order("desc").take(limit);
  },
});
