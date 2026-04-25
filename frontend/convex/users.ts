import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { checkAuth } from "./auth";

export const isSystemEmpty = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length === 0;
  },
});



/**
 * Sign In: Verify credentials and issue session token directly (no OTP required)
 */
export const signIn = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) throw new Error("Invalid credentials");

    // 1. Check lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      throw new Error(`Account locked. Try again in ${Math.ceil((user.lockUntil - Date.now()) / 60000)}m.`);
    }

    // 2. Verify Password - Cap length to prevent bcrypt DoS
    const passwordToCheck = args.password.slice(0, 100);
    const isPasswordValid = bcrypt.compareSync(passwordToCheck, user.password);
    if (!isPasswordValid) {
      const attempts = (user.failedAttempts ?? 0) + 1;
      const lockout = attempts >= 5 ? Date.now() + 15 * 60 * 1000 : undefined;
      await ctx.db.patch(user._id, { failedAttempts: attempts, lockUntil: lockout });
      throw new Error(attempts >= 5 ? "Account locked for 15 minutes." : "Invalid credentials");
    }

    // 3. Issue session token directly
    const token = randomBytes(32).toString("hex");
    const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await ctx.db.patch(user._id, {
      token,
      tokenExpiry: sessionExpiry,
      failedAttempts: 0,
      lockUntil: undefined,
    });

    return { token, email: user.email, role: user.role };
  },
});

/**
 * Initial Zero-User Setup (Root Ownership Version)
 */
export const initializeRootOwnership = mutation({
  args: { 
    email: v.string(), 
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    if (users.length > 0) {
      throw new Error("System is already initialized.");
    }


    // Hash the Master Password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(args.password, salt);

    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: hashedPassword,
      role: "super_admin",
      token: randomBytes(32).toString("hex"),
      tokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
      failedAttempts: 0
    });

    const user = await ctx.db.get(userId);
    return { token: user?.token, email: user?.email, role: user?.role };
  },
});

/**
 * Step 1 of Recovery: Generate a Secure Reset Token
 */
export const requestPasswordReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user || user.role !== "super_admin") {
      // For security, don't reveal if the user exists
      return { success: true }; 
    }

    // Rate limit: Block if a reset was requested in the last 60 seconds
    if (user.lastResetRequest && (Date.now() - user.lastResetRequest) < 60 * 1000) {
      throw new Error("Please wait 60 seconds before requesting another reset.");
    }

    // Generate a secure 6-digit numeric token
    const { randomInt } = await import("crypto");
    const token = randomInt(100000, 999999).toString();
    const expiry = Date.now() + 30 * 60 * 1000; // 30 minutes

    await ctx.db.patch(user._id, {
      resetToken: token,
      resetTokenExpiry: expiry,
      lastResetRequest: Date.now(),
    });

    return { success: true }; // SECURITY: Never return the token in the response
  }
});

/**
 * Step 2 of Recovery: Reset Password with a Valid Token
 */
export const resetPasswordWithToken = mutation({
  args: {
    email: v.string(),
    token: v.string(),
    newPassword: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user || user.resetToken !== args.token) {
      throw new Error("Invalid or expired reset token.");
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < Date.now()) {
      throw new Error("Reset token has expired.");
    }

    // Success -> Update password and clear token - also cap length
    const passwordToHash = args.newPassword.slice(0, 100);
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(passwordToHash, salt);
    
    await ctx.db.patch(user._id, {
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined,
      failedAttempts: 0,
      lockUntil: undefined
    });

    return { success: true };
  }
});

/**
 * Admin-Only: Create a new Staff Member
 */
export const createStaffAccount = mutation({
  args: {
    adminToken: v.string(),
    newEmail: v.string(),
    newPassword: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.adminToken, "super_admin");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.newEmail))
      .unique();
    if (existing) throw new Error("This email is already in use.");

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(args.newPassword, salt);

    await ctx.db.insert("users", {
      email: args.newEmail,
      password: hashedPassword,
      role: "staff",
      displayName: args.displayName || undefined,
    });

    return { success: true };
  },
});

/**
 * Admin-Only: List all users
 */
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

/**
 * Admin-Only: Remove a user
 */
export const removeUser = mutation({
  args: { 
    adminToken: v.string(),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.adminToken, "super_admin");

    const userToRemove = await ctx.db.get(args.userId);
    if (userToRemove?.role === "super_admin") {
      const superAdmins = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "super_admin")).collect();
      if (superAdmins.length <= 1) {
        throw new Error("Cannot remove the last Super Admin account.");
      }
    }

    await ctx.db.delete(args.userId);
  },
});


/**
 * Verify session token and return user info (READ-ONLY - queries cannot mutate)
 * Convex re-runs this query reactively — no need for a heartbeat arg.
 */
export const verifySession = query({
  args: { 
    token: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const user = await checkAuth(ctx, args.token);
      return { email: user.email, role: user.role, displayName: user.displayName || null };
    } catch {
      return null;
    }
  },
});

/**
 * Any logged-in user can update their own display name
 */
export const updateDisplayName = mutation({
  args: { token: v.string(), displayName: v.string() },
  handler: async (ctx, args) => {
    const user = await checkAuth(ctx, args.token);
    await ctx.db.patch(user._id, { displayName: args.displayName.trim() || undefined });
    return { success: true };
  },
});


/**
 * Admin-Only: Reset any user's password
 */
export const adminResetPassword = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx, args.adminToken, "super_admin");
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(args.newPassword, salt);
    await ctx.db.patch(args.userId, {
      password: hashedPassword,
      failedAttempts: 0,
      lockUntil: undefined,
      token: undefined,      // Force re-login with new password
      tokenExpiry: undefined,
    });
    return { success: true };
  },
});

/**
 * Secure Logout: Destroy the session token on the server
 */
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        token: undefined,
        tokenExpiry: undefined
      });
    }
    return { success: true };
  },
});

/**
 * Admin-Only: Get comprehensive system metrics for health monitoring
 */
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
      counts: {
        kitchen: kitchen.length,
        gym: gym.length,
        rooms: rooms.length,
        supplies: supplies.length,
        history: history.length,
        users: users.length,
        roomItems: roomItems.length
      },
      health: {
        totalDocuments: totalDocs,
        limit: 100000,
        usagePercentage: (totalDocs / 100000) * 100,
        status: totalDocs > 80000 ? "CRITICAL" : totalDocs > 50000 ? "SCALING REQUIRED" : "OPTIMAL"
      }
    };
  },
});
