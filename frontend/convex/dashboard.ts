import { v } from "convex/values";
import { query } from "./_generated/server";
import { checkAuth } from "./auth";

/**
 * CONSOLIDATED DASHBOARD STATS (Production Hardening)
 * This query combines 4 separate calls into one, reducing Convex usage by 75%.
 */
export const getStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // 1. Authenticate once
    const user = await checkAuth(ctx, args.token);
    if (!user) return null;

    // 2. Fetch all data in parallel inside the database engine
    const [kitchen, gym, rooms, supplies] = await Promise.all([
      ctx.db.query("items").collect(),
      ctx.db.query("gymItems").collect(),
      ctx.db.query("rooms").collect(),
      ctx.db.query("generalSupplies").collect()
    ]);

    // 3. Perform the calculation on the server side
    return {
      kitchen: {
        total: kitchen.length,
        lowStock: kitchen.filter(i => i.quantity <= (i.reorderLevel || 0)).length,
      },
      gym: {
        total: gym.length,
        maintenance: gym.filter(i => i.condition === 'Maintenance' || i.condition === 'Broken').length,
      },
      rooms: {
        total: rooms.length,
        ready: rooms.filter(r => r.status === 'Ready').length,
        maintenance: rooms.filter(r => r.status === 'Maintenance').length,
      },
      supplies: {
        total: supplies.length,
        lowStock: supplies.filter(s => s.quantity <= (s.reorderLevel || 0)).length,
      }
    };
  },
});
