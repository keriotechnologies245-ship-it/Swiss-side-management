import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("items").first();
    if (!existing) {
      await ctx.db.insert("items", {
        name: "Example Sugar",
        unit: "kg",
        quantity: 10,
        reorderLevel: 5
      });
    }
  }
});
