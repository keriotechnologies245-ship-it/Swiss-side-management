import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rooms").collect();
  },
});

export const getById = query({
  args: { id: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    status: v.union(v.literal("Ready"), v.literal("Occupied"), v.literal("Cleaning"), v.literal("Maintenance")),
    notes: v.optional(v.string()),
    needs: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rooms", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("rooms"),
    name: v.string(),
    type: v.string(),
    status: v.union(v.literal("Ready"), v.literal("Occupied"), v.literal("Cleaning"), v.literal("Maintenance")),
    notes: v.optional(v.string()),
    needs: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("rooms") },
  handler: async (ctx, args) => {
    // Also remove items associated with this room
    const items = await ctx.db
      .query("roomItems")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.id))
      .collect();
    
    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.id);
  },
});
