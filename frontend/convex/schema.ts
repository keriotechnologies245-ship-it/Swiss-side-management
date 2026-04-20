import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(), // This will store the bcrypt hash
    role: v.union(v.literal("super_admin"), v.literal("staff")),
    token: v.optional(v.string()), // Current session token
    tokenExpiry: v.optional(v.number()), // Timestamp for session expiration
    failedAttempts: v.optional(v.number()), // For brute-force protection
    lockUntil: v.optional(v.number()), // Timestamp for account lockout
    otpCode: v.optional(v.string()), // Temporary 6-digit OTP
    otpExpiry: v.optional(v.number()), // Timestamp for OTP expiration
    resetToken: v.optional(v.string()), // For email password reset
    resetTokenExpiry: v.optional(v.number()), // Reset token expiration
  })
  .index("by_email", ["email"])
  .index("by_role", ["role"]),
  
  items: defineTable({
    name: v.string(),
    unit: v.string(),
    quantity: v.number(),
    reorderLevel: v.number(),
  }),
  transactions: defineTable({
    itemId: v.id("items"),
    itemName: v.string(),
    type: v.union(v.literal("RESTOCK"), v.literal("WITHDRAWAL")),
    quantity: v.number(),
    unit: v.string(),
    person: v.string(),
    notes: v.optional(v.string()),
  }),
});
