import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("generalSupplies").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    quantity: v.number(),
    unit: v.string(),
    reorderLevel: v.number(),
    category: v.union(v.literal("Cleaning"), v.literal("Toiletries"), v.literal("Office"), v.literal("Other")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generalSupplies", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("generalSupplies"),
    name: v.string(),
    quantity: v.number(),
    unit: v.string(),
    reorderLevel: v.number(),
    category: v.union(v.literal("Cleaning"), v.literal("Toiletries"), v.literal("Office"), v.literal("Other")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("generalSupplies") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
