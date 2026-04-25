import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { checkAuth } from "./auth";
import { internal } from "./_generated/api";

/**
 * Proactive Error Monitoring: Log client-side crashes to the database
 */
export const logClientError = mutation({
  args: {
    userEmail: v.optional(v.string()),
    message: v.string(),
    stack: v.optional(v.string()),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("systemErrors", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const isSystemEmpty = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length === 0;
  },
});

/**
 * INTERNAL ONLY: Auth Helper
 */
export const getUserForAuthInternal = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

/**
 * INTERNAL ONLY: Issue Session
 */
export const issueSessionInternal = internalMutation({
  args: { userId: v.id("users"), token: v.string() },
  handler: async (ctx, args) => {
    const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await ctx.db.patch(args.userId, {
      token: args.token,
      tokenExpiry: sessionExpiry,
      failedAttempts: 0,
      lockUntil: undefined,
    });
  },
});

/**
 * INTERNAL ONLY: Failed Attempt Lockout
 */
export const handleFailedAttemptInternal = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    const attempts = (user.failedAttempts ?? 0) + 1;
    const lockout = attempts >= 5 ? Date.now() + 15 * 60 * 1000 : undefined;
    await ctx.db.patch(args.userId, { failedAttempts: attempts, lockUntil: lockout });
  },
});

/**
 * INTERNAL ONLY: Initialize System
 */
export const initializeInternal = internalMutation({
  args: { email: v.string(), password: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    if (users.length > 0) throw new Error("Already initialized");

    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: args.password,
      role: "super_admin",
      token: args.token,
      tokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
      failedAttempts: 0
    });

    const user = await ctx.db.get(userId);
    return { token: user?.token, email: user?.email, role: user?.role };
  },
});

/**
 * INTERNAL ONLY: Create Staff
 */
export const createStaffInternal = internalMutation({
  args: {
    adminToken: v.string(),
    newEmail: v.string(),
    hashedPassword: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await checkAuth(ctx, args.adminToken, "super_admin");
    
    await ctx.db.insert("users", {
      email: args.newEmail,
      password: args.hashedPassword,
      role: "staff",
      displayName: args.displayName,
    });

    await ctx.db.insert("adminLogs", {
      adminEmail: admin.email,
      action: "CREATE_STAFF",
      targetEmail: args.newEmail,
    });
  },
});

/**
 * INTERNAL ONLY: Admin Reset
 */
export const adminResetPasswordInternal = internalMutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
    hashedPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await checkAuth(ctx, args.adminToken, "super_admin");
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      password: args.hashedPassword,
      failedAttempts: 0,
      lockUntil: undefined,
      token: undefined,
    });

    await ctx.db.insert("adminLogs", {
      adminEmail: admin.email,
      action: "ADMIN_RESET_PASSWORD",
      targetEmail: user.email,
    });
  },
});

/**
 * INTERNAL ONLY: Token Reset
 */
export const resetPasswordWithTokenInternal = internalMutation({
  args: { email: v.string(), token: v.string(), hashedPassword: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user || user.resetToken !== args.token) throw new Error("Invalid token");
    if (user.resetTokenExpiry && user.resetTokenExpiry < Date.now()) throw new Error("Expired");

    await ctx.db.patch(user._id, {
      password: args.hashedPassword,
      resetToken: undefined,
      failedAttempts: 0,
      lockUntil: undefined
    });
  },
});

export const listAllUsers = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.adminToken, "super_admin");
    const users = await ctx.db.query("users").collect();
    return users.map(u => ({
      _id: u._id,
      email: u.email,
      role: u.role,
      displayName: u.displayName || null,
    }));
  },
});

export const removeUser = mutation({
  args: { adminToken: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await checkAuth(ctx, args.adminToken, "super_admin");
    const userToRemove = await ctx.db.get(args.userId);
    if (!userToRemove) return;

    if (userToRemove.role === "super_admin") {
      const superAdmins = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "super_admin")).collect();
      if (superAdmins.length <= 1) throw new Error("Cannot remove last admin");
    }

    await ctx.db.delete(args.userId);
    await ctx.db.insert("adminLogs", {
      adminEmail: admin.email,
      action: "REMOVE_USER",
      targetEmail: userToRemove.email,
    });
  },
});

export const verifySession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    try {
      const user = await checkAuth(ctx, args.token);
      return { email: user.email, role: user.role, displayName: user.displayName || null };
    } catch {
      return null;
    }
  },
});

export const updateDisplayName = mutation({
  args: { token: v.string(), displayName: v.string() },
  handler: async (ctx, args) => {
    const user = await checkAuth(ctx, args.token);
    await ctx.db.patch(user._id, { displayName: args.displayName.trim() || undefined });
    return { success: true };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_token", (q: any) => q.eq("token", args.token)).unique();
    if (user) await ctx.db.patch(user._id, { token: undefined, tokenExpiry: undefined });
    return { success: true };
  },
});

export const getSystemMetrics = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.adminToken, "super_admin");
    const [kitchen, gym, rooms, supplies, history, users, roomItems] = await Promise.all([
      ctx.db.query("items").collect(),
      ctx.db.query("gymItems").collect(),
      ctx.db.query("rooms").collect(),
      ctx.db.query("generalSupplies").collect(),
      ctx.db.query("transactions").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("roomItems").collect()
    ]);
    const totalDocs = kitchen.length + gym.length + rooms.length + supplies.length + history.length + users.length + roomItems.length;
    return {
      counts: { kitchen: kitchen.length, gym: gym.length, rooms: rooms.length, supplies: supplies.length, history: history.length, users: users.length, roomItems: roomItems.length },
      health: { totalDocuments: totalDocs, limit: 100000, usagePercentage: (totalDocs / 100000) * 100, status: totalDocs > 80000 ? "CRITICAL" : totalDocs > 50000 ? "SCALING REQUIRED" : "OPTIMAL" }
    };
  },
});

export const getOtpForEmailInternal = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).unique();
    return user ? { otpCode: user.otpCode } : null;
  },
});

export const generateResetTokenInternal = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).unique();
    if (!user || user.role !== "super_admin") return null;
    if (user.lastResetRequest && (Date.now() - user.lastResetRequest) < 60 * 1000) throw new Error("RATE_LIMIT");
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    await ctx.db.patch(user._id, { resetToken: token, resetTokenExpiry: Date.now() + 30 * 60 * 1000, lastResetRequest: Date.now() });
    return token;
  },
});
