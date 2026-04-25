import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAuth } from "./auth";

export const getAll = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token);
    return await ctx.db.query("roomItems").collect();
  },
});

export const getByRoom = query({
  args: { token: v.string(), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token);
    return await ctx.db
      .query("roomItems")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    roomId: v.id("rooms"),
    itemName: v.string(),
    condition: v.union(v.literal("Excellent"), v.literal("Good"), v.literal("Maintenance"), v.literal("Broken")),
    quantity: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { token, ...data } = args;
    await checkAuth(ctx, token, "staff");
    return await ctx.db.insert("roomItems", data);
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("roomItems"),
    roomId: v.id("rooms"),
    itemName: v.string(),
    condition: v.union(v.literal("Excellent"), v.literal("Good"), v.literal("Maintenance"), v.literal("Broken")),
    quantity: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { token, id, ...rest } = args;
    await checkAuth(ctx, token, "staff");
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { 
    token: v.string(),
    id: v.id("roomItems") 
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token, "staff");
    await ctx.db.delete(args.id);
  },
});
