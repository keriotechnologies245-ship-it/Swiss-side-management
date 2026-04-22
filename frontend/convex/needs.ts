import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("needs").collect();
  },
});

export const getByDepartment = query({
  args: { department: v.union(v.literal("Kitchen"), v.literal("Gym"), v.literal("Rooms"), v.literal("General")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("needs")
      .withIndex("by_department", (q) => q.eq("department", args.department))
      .collect();
  },
});

export const create = mutation({
  args: {
    department: v.union(v.literal("Kitchen"), v.literal("Gym"), v.literal("Rooms"), v.literal("General")),
    item: v.string(),
    quantity: v.optional(v.string()),
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
    notes: v.optional(v.string()),
    requestor: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("needs", {
      ...args,
      status: "Pending",
    });
  },
});

export const updateStatus = mutation({
  args: { id: v.id("needs"), status: v.union(v.literal("Pending"), v.literal("Ordered"), v.literal("Fulfilled")) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { id: v.id("needs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
