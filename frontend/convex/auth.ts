import { v } from "convex/values";

/**
 * INTERNAL HELPER: Verifies a session token and returns the user object.
 * This ensures that only authorized Swiss Side personnel can modify data.
 */
export async function checkAuth(ctx: any, token: string, requiredRole?: "super_admin" | "staff") {
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .unique();

  if (!user) throw new Error("Unauthorized: Invalid session token.");
  
  if (user.tokenExpiry && user.tokenExpiry < Date.now()) {
    throw new Error("Session expired. Please log in again.");
  }

  if (requiredRole && user.role !== requiredRole && user.role !== "super_admin") {
    throw new Error("Forbidden: You do not have permission for this operation.");
  }

  return user;
}

export const authArgs = {
  token: v.string(),
};
