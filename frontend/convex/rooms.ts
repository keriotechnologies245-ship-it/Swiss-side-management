import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAuth } from "./auth";

export const getAll = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token);
    return await ctx.db.query("rooms").collect();
  },
});

export const getById = query({
  args: { token: v.string(), id: v.id("rooms") },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    type: v.string(),
    status: v.union(v.literal("Ready"), v.literal("Occupied"), v.literal("Cleaning"), v.literal("Maintenance")),
    notes: v.optional(v.string()),
    needs: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { token, ...data } = args;
    await checkAuth(ctx, token, "staff");
    const roomId = await ctx.db.insert("rooms", data);

    // Fetch the dynamic master template
    const templates = await ctx.db.query("roomTemplates").collect();

    for (const t of templates) {
      await ctx.db.insert("roomItems", {
        roomId,
        itemName: t.itemName,
        condition: "Excellent",
        quantity: t.quantity,
        notes: "Standard essential item"
      });
    }

    return roomId;
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("rooms"),
    name: v.string(),
    type: v.string(),
    status: v.union(v.literal("Ready"), v.literal("Occupied"), v.literal("Cleaning"), v.literal("Maintenance")),
    notes: v.optional(v.string()),
    needs: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { token, id, ...rest } = args;
    await checkAuth(ctx, token, "staff"); // Staff can update status, but not delete
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { 
    token: v.string(),
    id: v.id("rooms") 
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token, "staff");
    
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
