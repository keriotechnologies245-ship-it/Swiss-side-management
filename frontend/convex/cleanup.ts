import { mutation } from "./_generated/server";

export const wipeUsers = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
  },
});
