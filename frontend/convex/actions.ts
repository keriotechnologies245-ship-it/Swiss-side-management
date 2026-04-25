"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

/**
 * ACTION: Sign In
 * Handles password verification in Node runtime, then calls internal mutation to issue session.
 */
export const signIn = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    // 1. Get user data via internal query
    const user = await ctx.runQuery(internal.users.getUserForAuthInternal, { email: args.email });
    if (!user) throw new Error("Invalid credentials");

    // 2. Check lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      throw new Error(`Account locked. Try again in ${Math.ceil((user.lockUntil - Date.now()) / 60000)}m.`);
    }

    // 3. Verify Password
    const passwordToCheck = args.password.slice(0, 100);
    const isPasswordValid = bcrypt.compareSync(passwordToCheck, user.password);
    
    if (!isPasswordValid) {
      // Trigger lockout logic via internal mutation
      await ctx.runMutation(internal.users.handleFailedAttemptInternal, { userId: user._id });
      throw new Error("Invalid credentials");
    }

    // 4. Issue session token
    const token = randomBytes(32).toString("hex");
    await ctx.runMutation(internal.users.issueSessionInternal, { userId: user._id, token });

    return { token, email: user.email, role: user.role };
  },
});

/**
 * ACTION: Initialize System
 */
export const initializeSystem = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(args.password, salt);
    const token = randomBytes(32).toString("hex");

    return await ctx.runMutation(internal.users.initializeInternal, {
      email: args.email,
      password: hashedPassword,
      token,
    });
  },
});

/**
 * ACTION: Create Staff
 */
export const createStaff = action({
  args: {
    adminToken: v.string(),
    newEmail: v.string(),
    newPassword: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(args.newPassword, salt);

    return await ctx.runMutation(internal.users.createStaffInternal, {
      adminToken: args.adminToken,
      newEmail: args.newEmail,
      hashedPassword,
      displayName: args.displayName,
    });
  },
});

/**
 * ACTION: Admin Reset Password
 */
export const adminResetPasswordAction = action({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(args.newPassword, salt);

    return await ctx.runMutation(internal.users.adminResetPasswordInternal, {
      adminToken: args.adminToken,
      userId: args.userId,
      hashedPassword,
    });
  },
});

/**
 * ACTION: Reset Password with Token
 */
export const resetPasswordWithTokenAction = action({
  args: { email: v.string(), token: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(args.newPassword, salt);

    return await ctx.runMutation(internal.users.resetPasswordWithTokenInternal, {
      email: args.email,
      token: args.token,
      hashedPassword,
    });
  },
});
