import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - linked to Clerk via tokenIdentifier
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  // Calendar events
  events: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(), // timestamp
    endDate: v.number(), // timestamp
    allDay: v.boolean(),
    color: v.optional(v.string()), // hex color for event
    googleEventId: v.optional(v.string()), // Google Calendar event ID for deduplication
    // Recurrence fields
    isRecurring: v.optional(v.boolean()),
    recurrencePattern: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    )),
    recurrenceEndDate: v.optional(v.number()), // when recurrence ends (timestamp)
    parentEventId: v.optional(v.id("events")), // for recurring instances, points to the parent
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "startDate"])
    .index("by_google_event", ["userId", "googleEventId"])
    .index("by_parent", ["parentEventId"]),

  // To-do items
  todos: defineTable({
    userId: v.id("users"),
    title: v.string(),
    completed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_completed", ["userId", "completed"]),
});
