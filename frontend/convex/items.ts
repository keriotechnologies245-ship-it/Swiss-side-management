import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("items").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    unit: v.string(),
    quantity: v.number(),
    reorderLevel: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("items", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("items"),
    name: v.string(),
    unit: v.string(),
    quantity: v.number(),
    reorderLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
