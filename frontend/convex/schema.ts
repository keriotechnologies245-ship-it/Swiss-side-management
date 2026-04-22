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
  .index("by_token", ["token"])
  .index("by_role", ["role"]),
  
  items: defineTable({
    name: v.string(),
    unit: v.string(),
    quantity: v.number(),
    reorderLevel: v.number(),
  })
  .index("by_name", ["name"]),

  gymItems: defineTable({
    name: v.string(),
    condition: v.union(v.literal("Excellent"), v.literal("Good"), v.literal("Maintenance"), v.literal("Broken")),
    quantity: v.number(),
    lastChecked: v.optional(v.string()), // Date string
    notes: v.optional(v.string()),
  })
  .index("by_name", ["name"]),

  rooms: defineTable({
    name: v.string(), // e.g. "Room 101", "Tent 1"
    type: v.string(), // e.g. "Standard", "Deluxe", "Family"
    status: v.union(v.literal("Ready"), v.literal("Occupied"), v.literal("Cleaning"), v.literal("Maintenance")),
    notes: v.optional(v.string()),
    needs: v.optional(v.string()), // Added for "What is needed" notes
  })
  .index("by_name", ["name"]),

  roomItems: defineTable({
    roomId: v.id("rooms"),
    itemName: v.string(),
    condition: v.union(v.literal("Excellent"), v.literal("Good"), v.literal("Maintenance"), v.literal("Broken")),
    quantity: v.number(),
    notes: v.optional(v.string()),
  })
  .index("by_roomId", ["roomId"])
  .index("by_itemName", ["itemName"]),

  gymTransactions: defineTable({
    itemId: v.id("gymItems"),
    itemName: v.string(),
    type: v.union(v.literal("MAINTENANCE"), v.literal("REPLACEMENT"), v.literal("NEW_ASSET")),
    quantity: v.number(),
    person: v.string(),
    notes: v.optional(v.string()),
  })
  .index("by_itemId", ["itemId"]),

  roomTransactions: defineTable({
    roomId: v.id("rooms"),
    roomName: v.string(),
    itemName: v.string(),
    type: v.union(v.literal("REPLACEMENT"), v.literal("REPAIR"), v.literal("CLEANING_SUPPLY")),
    quantity: v.number(),
    person: v.string(),
    notes: v.optional(v.string()),
  })
  .index("by_roomId", ["roomId"]),

  transactions: defineTable({
    itemId: v.id("items"),
    itemName: v.string(),
    type: v.union(v.literal("RESTOCK"), v.literal("WITHDRAWAL")),
    quantity: v.number(),
    unit: v.string(),
    person: v.string(),
    notes: v.optional(v.string()),
  })
  .index("by_itemId", ["itemId"])
  .index("by_type", ["type"]),

  needs: defineTable({
    department: v.union(v.literal("Kitchen"), v.literal("Gym"), v.literal("Rooms"), v.literal("General")),
    item: v.string(),
    quantity: v.optional(v.string()),
    status: v.union(v.literal("Pending"), v.literal("Ordered"), v.literal("Fulfilled")),
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
    notes: v.optional(v.string()),
    requestor: v.string(),
  })
  .index("by_department", ["department"]),

  generalSupplies: defineTable({
    name: v.string(),
    quantity: v.number(),
    unit: v.string(),
    reorderLevel: v.number(),
    category: v.union(v.literal("Cleaning"), v.literal("Toiletries"), v.literal("Office"), v.literal("Other")),
    notes: v.optional(v.string()),
  }),
});
