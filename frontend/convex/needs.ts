import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { checkAuth } from "./auth";

export const getAll = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token);
    return await ctx.db.query("needs").collect();
  },
});

export const getByDepartment = query({
  args: { token: v.string(), department: v.union(v.literal("Kitchen"), v.literal("Gym"), v.literal("Rooms"), v.literal("General")) },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token);
    return await ctx.db
      .query("needs")
      .withIndex("by_department", (q) => q.eq("department", args.department))
      .collect();
  },
});

export const getByRoom = query({
  args: { token: v.string(), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token);
    return await ctx.db
      .query("needs")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    department: v.union(v.literal("Kitchen"), v.literal("Gym"), v.literal("Rooms"), v.literal("General")),
    roomId: v.optional(v.id("rooms")),
    item: v.string(),
    quantity: v.optional(v.string()),
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
    notes: v.optional(v.string()),
    requestor: v.string(),
  },
  handler: async (ctx, args) => {
    const { token, ...data } = args;
    await checkAuth(ctx, token, "staff");

    // Input sanitization and length limits
    const sanitizedItem = data.item.trim().slice(0, 100);
    const sanitizedNotes = data.notes?.trim().slice(0, 500);
    const sanitizedRequestor = data.requestor.trim().slice(0, 100);

    return await ctx.db.insert("needs", {
      ...data,
      item: sanitizedItem,
      notes: sanitizedNotes,
      requestor: sanitizedRequestor,
      status: "Pending",
    });
  },
});

export const updateStatus = mutation({
  args: { 
    token: v.string(),
    id: v.id("needs"), 
    status: v.union(v.literal("Pending"), v.literal("Ordered"), v.literal("Fulfilled")) 
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token, "staff");
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { 
    token: v.string(),
    id: v.id("needs") 
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token, "staff");
    await ctx.db.delete(args.id);
  },
});
