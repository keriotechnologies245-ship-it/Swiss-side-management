import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("gymItems").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    condition: v.union(v.literal("Excellent"), v.literal("Good"), v.literal("Maintenance"), v.literal("Broken")),
    quantity: v.number(),
    lastChecked: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gymItems", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("gymItems"),
    name: v.string(),
    condition: v.union(v.literal("Excellent"), v.literal("Good"), v.literal("Maintenance"), v.literal("Broken")),
    quantity: v.number(),
    lastChecked: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("gymItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
