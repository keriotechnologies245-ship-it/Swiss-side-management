import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import { checkAuth } from "./auth";

export const isSystemEmpty = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length === 0;
  },
});


/**
 * Step 1: Verify Password and Generate OTP
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

    // 2. Verify Password
    const isPasswordValid = bcrypt.compareSync(args.password, user.password);
    if (!isPasswordValid) {
      const attempts = (user.failedAttempts ?? 0) + 1;
      const lockout = attempts >= 5 ? Date.now() + 15 * 60 * 1000 : undefined;
      await ctx.db.patch(user._id, { failedAttempts: attempts, lockUntil: lockout });
      throw new Error(attempts >= 5 ? "Account locked for 15 minutes." : "Invalid credentials");
    }

    // 3. Password correct -> Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await ctx.db.patch(user._id, { 
      otpCode: otp, 
      otpExpiry: expiry,
      failedAttempts: 0 
    });

    return { requiresOtp: true, email: user.email };
  },
});

/**
 * Step 2: Verify OTP and grant Session Token
 */
export const verifyOtp = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user || user.otpCode !== args.code) {
      throw new Error("Invalid or expired OTP code.");
    }

    if (user.otpExpiry && user.otpExpiry < Date.now()) {
      throw new Error("OTP code has expired.");
    }

    // Success -> Issue session token
    const token = Math.random().toString(36).substring(7) + Date.now();
    const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000;

    await ctx.db.patch(user._id, {
      token,
      tokenExpiry: sessionExpiry,
      otpCode: undefined, // Clear OTP after use
      otpExpiry: undefined
    });

    return { token, email: user.email, role: user.role };
  }
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
      token: Math.random().toString(36).substring(7) + Date.now(),
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

    // Generate a secure 6-digit numeric token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 30 * 60 * 1000; // 30 minutes

    await ctx.db.patch(user._id, {
      resetToken: token,
      resetTokenExpiry: expiry
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

    // Success -> Update password and clear token
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(args.newPassword, salt);
    
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
  },
  handler: async (ctx, args) => {
    // 1. Verify the caller is indeed the Super Admin
    await checkAuth(ctx, args.adminToken, "super_admin");

    // 2. Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.newEmail))
      .unique();
    if (existing) throw new Error("This email is already in use.");

    // 3. Hash the new staff member's password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(args.newPassword, salt);

    await ctx.db.insert("users", {
      email: args.newEmail,
      password: hashedPassword,
      role: "staff",
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
    
    // SECURITY: Never return password hashes or session tokens to the frontend
    return users.map(u => ({
      _id: u._id,
      email: u.email,
      role: u.role
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
 * Internal: Fetch OTP for email (Used by Resend Action)
 */
export const getOtpForEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    return user ? { otpCode: user.otpCode } : null;
  },
});

/**
 * Verify session token and return user info (READ-ONLY - queries cannot mutate)
 */
export const verifySession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    try {
      const user = await checkAuth(ctx, args.token);
      return { email: user.email, role: user.role };
    } catch {
      return null;
    }
  },
});

/**
 * Self-healing mutation: Promote the only user to super_admin if they are not already.
 * Called from the frontend after login if user has no admin access.
 */
export const promoteOnlyUserToAdmin = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .unique();
    if (!user) throw new Error("Invalid session.");
    const allUsers = await ctx.db.query("users").collect();
    if (allUsers.length === 1 && user.role !== "super_admin") {
      await ctx.db.patch(user._id, { role: "super_admin" });
      return { promoted: true };
    }
    return { promoted: false };
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
