import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("transactions").order("desc").collect();
  },
});

export const withdraw = mutation({
  args: {
    itemId: v.id("items"),
    quantity: v.number(),
    person: v.string(),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    if (item.quantity < args.quantity) {
      throw new Error(`Insufficient stock. Only ${item.quantity} ${item.unit} available.`);
    }

    // Deduct stock
    await ctx.db.patch(args.itemId, {
      quantity: item.quantity - args.quantity
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      itemId: args.itemId,
      itemName: item.name,
      type: "WITHDRAWAL",
      quantity: args.quantity,
      unit: item.unit,
      person: args.person,
      notes: args.notes
    });
  }
});

export const restock = mutation({
  args: {
    itemId: v.id("items"),
    quantity: v.number(),
    person: v.string(),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    // Add stock
    await ctx.db.patch(args.itemId, {
      quantity: item.quantity + args.quantity
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      itemId: args.itemId,
      itemName: item.name,
      type: "RESTOCK",
      quantity: args.quantity,
      unit: item.unit,
      person: args.person,
      notes: args.notes
    });
  }
});
