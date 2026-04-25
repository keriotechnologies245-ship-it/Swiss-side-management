import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAuth } from "./auth";

/**
 * Paginated History Query
 */
export const getHistory = query({
  args: { 
    token: v.string(), 
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token);
    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;
    
    // We use .collect() then slice for simple pagination at small scale
    // In larger production, we'd use .paginate() with cursors
    const all = await ctx.db.query("transactions").order("desc").collect();
    return {
      items: all.slice(offset, offset + limit),
      total: all.length,
      hasMore: offset + limit < all.length
    };
  },
});

/**
 * Data Export: Fetch everything for CSV generation
 */
export const getAllHistoryForExport = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token, "super_admin");
    return await ctx.db.query("transactions").order("desc").collect();
  },
});

/**
 * Admin Logs Query
 */
export const getAdminLogs = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token, "super_admin");
    return await ctx.db.query("adminLogs").order("desc").take(100);
  },
});

/**
 * INTERNAL: Log an Admin Action
 */
export const logAdminAction = internalMutation({
  args: {
    adminEmail: v.string(),
    action: v.string(),
    targetEmail: v.string(),
    details: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("adminLogs", args);
  },
});

export const withdraw = mutation({
  args: {
    token: v.string(),
    itemId: v.union(v.id("items"), v.id("generalSupplies")),
    quantity: v.number(),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { token, ...data } = args;
    const user = await checkAuth(ctx, token, "staff");

    const item = await ctx.db.get(data.itemId);
    if (!item) throw new Error("Item not found");
    if (item.quantity < data.quantity) {
      throw new Error(`Insufficient stock. Only ${item.quantity} ${item.unit} available.`);
    }

    await ctx.db.patch(data.itemId, {
      quantity: item.quantity - data.quantity
    });

    await ctx.db.insert("transactions", {
      itemId: data.itemId,
      itemName: item.name,
      type: "WITHDRAWAL",
      quantity: data.quantity,
      unit: item.unit,
      person: user.displayName || user.email,
      notes: data.notes
    });
  }
});

export const restock = mutation({
  args: {
    token: v.string(),
    itemId: v.union(v.id("items"), v.id("generalSupplies")),
    quantity: v.number(),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { token, ...data } = args;
    const user = await checkAuth(ctx, token, "staff");

    const item = await ctx.db.get(data.itemId);
    if (!item) throw new Error("Item not found");

    await ctx.db.patch(data.itemId, {
      quantity: item.quantity + data.quantity
    });

    await ctx.db.insert("transactions", {
      itemId: data.itemId,
      itemName: item.name,
      type: "RESTOCK",
      quantity: data.quantity,
      unit: item.unit,
      person: user.displayName || user.email,
      notes: data.notes
    });
  }
});
