import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkAuth } from "./auth";

export const getHistory = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token);
    // Added limit to prevent memory issues as database grows
    return await ctx.db.query("transactions").order("desc").take(100);
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

    // Deduct stock
    await ctx.db.patch(data.itemId, {
      quantity: item.quantity - data.quantity
    });

    // Log transaction
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

    // Add stock
    await ctx.db.patch(data.itemId, {
      quantity: item.quantity + data.quantity
    });

    // Log transaction
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
