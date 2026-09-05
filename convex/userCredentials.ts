import { v } from "convex/values";

import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { requireWorkOsUserId } from "./workosAuth";

const providerSchema = v.union(v.literal("daytona"), v.literal("openai"));

const metadataSchema = v.object({
  provider: providerSchema,
  keySuffix: v.string(),
  updatedAt: v.number(),
});

type Provider = "daytona" | "openai";

async function findOwnedCredential(
  ctx: QueryCtx | MutationCtx,
  provider: Provider,
) {
  const userId = await requireWorkOsUserId(ctx);
  const row = await ctx.db
    .query("userCredentials")
    .withIndex("by_user_and_provider", (q) =>
      q.eq("userId", userId).eq("provider", provider),
    )
    .unique();
  return { row, userId };
}

export const upsertEncrypted = mutation({
  args: {
    provider: providerSchema,
    ciphertext: v.string(),
    iv: v.string(),
    keySuffix: v.string(),
  },
  returns: v.id("userCredentials"),
  handler: async (ctx, args) => {
    const { row: existing, userId } = await findOwnedCredential(
      ctx,
      args.provider,
    );
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ciphertext: args.ciphertext,
        iv: args.iv,
        keySuffix: args.keySuffix,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("userCredentials", {
      userId,
      provider: args.provider,
      ciphertext: args.ciphertext,
      iv: args.iv,
      keySuffix: args.keySuffix,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: {
    provider: providerSchema,
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const { row: existing } = await findOwnedCredential(ctx, args.provider);
    if (!existing) return { ok: false };
    await ctx.db.delete(existing._id);
    return { ok: true };
  },
});

export const listForUser = query({
  args: {},
  returns: v.array(metadataSchema),
  handler: async (ctx) => {
    const userId = await requireWorkOsUserId(ctx);
    const rows = await ctx.db
      .query("userCredentials")
      .withIndex("by_user_and_provider", (q) => q.eq("userId", userId))
      .collect();

    return rows.map((row) => ({
      provider: row.provider,
      keySuffix: row.keySuffix,
      updatedAt: row.updatedAt,
    }));
  },
});

export const getEncrypted = query({
  args: {
    provider: providerSchema,
  },
  returns: v.union(
    v.object({
      provider: providerSchema,
      ciphertext: v.string(),
      iv: v.string(),
      keySuffix: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const { row } = await findOwnedCredential(ctx, args.provider);
    if (!row) return null;
    return {
      provider: row.provider,
      ciphertext: row.ciphertext,
      iv: row.iv,
      keySuffix: row.keySuffix,
    };
  },
});
