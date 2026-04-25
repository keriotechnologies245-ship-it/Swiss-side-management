import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAuth } from "./auth";

export const getAll = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token);
    return await ctx.db.query("roomTemplates").collect();
  },
});

export const add = mutation({
  args: {
    token: v.string(),
    itemName: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const { token, ...data } = args;
    await checkAuth(ctx, token, "super_admin");
    return await ctx.db.insert("roomTemplates", data);
  },
});

export const remove = mutation({
  args: { 
    token: v.string(),
    id: v.id("roomTemplates") 
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.token, "super_admin");
    await ctx.db.delete(args.id);
  },
});

export const initializeDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("roomTemplates").collect();
    if (existing.length === 0) {
      const essentials = [
        { itemName: "Bed Mattress", quantity: 1 },
        { itemName: "Pillows", quantity: 2 },
        { itemName: "Bed Sheets & Linens", quantity: 2 },
        { itemName: "Blanket / Duvet", quantity: 1 },
        { itemName: "Towels", quantity: 2 },
        { itemName: "Trash Can", quantity: 1 },
        { itemName: "Drinking Glasses", quantity: 2 },
        { itemName: "Bedside Lamp", quantity: 1 },
        { itemName: "Mosquito Net", quantity: 1 },
      ];
      for (const item of essentials) {
        await ctx.db.insert("roomTemplates", item);
      }
    }
  }
});
