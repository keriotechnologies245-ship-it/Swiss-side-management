import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { checkAuth } from "./auth";

export const getAll = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token);
    return await ctx.db.query("generalSupplies").collect();
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    quantity: v.number(),
    unit: v.string(),
    reorderLevel: v.number(),
    category: v.union(v.literal("Cleaning"), v.literal("Toiletries"), v.literal("Office"), v.literal("Other")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { token, ...data } = args;
    await checkAuth(ctx, token, "staff");
    return await ctx.db.insert("generalSupplies", data);
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("generalSupplies"),
    name: v.string(),
    quantity: v.number(),
    unit: v.string(),
    reorderLevel: v.number(),
    category: v.union(v.literal("Cleaning"), v.literal("Toiletries"), v.literal("Office"), v.literal("Other")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { token, id, ...data } = args;
    await checkAuth(ctx, token, "staff");
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { 
    token: v.string(),
    id: v.id("generalSupplies") 
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token, "staff");
    await ctx.db.delete(args.id);
  },
});
