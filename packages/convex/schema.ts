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

  // Claude Dashboard - Tasks
  claudeTasks: defineTable({
    title: v.string(),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    createdBy: v.optional(v.string()), // instance name that created it
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_category", ["category"]),

  // Claude Dashboard - Instances
  claudeInstances: defineTable({
    name: v.string(),
    pid: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("idle"), v.literal("offline")),
    ramUsage: v.optional(v.number()), // MB
    lastHeartbeat: v.number(),
    startedAt: v.number(),
    metadata: v.optional(v.string()), // JSON string for extra data
  })
    .index("by_name", ["name"])
    .index("by_status", ["status"]),

  // Claude Dashboard - Command Log
  claudeCommands: defineTable({
    instanceName: v.string(),
    command: v.string(),
    output: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("error")),
    createdAt: v.number(),
  })
    .index("by_instance", ["instanceName"])
    .index("by_status", ["status"]),

  // VNC Pasted Images - for syncing images from phone to VNC sessions
  pastedImages: defineTable({
    vncSession: v.string(), // e.g., "claude1", "claude2", etc.
    fileName: v.string(), // original or generated filename
    storageId: v.id("_storage"), // Convex file storage ID
    mimeType: v.string(), // e.g., "image/png", "image/jpeg"
    size: v.number(), // file size in bytes
    uploadedAt: v.number(), // timestamp
    syncedAt: v.optional(v.number()), // when it was synced to local folder
  })
    .index("by_session", ["vncSession"])
    .index("by_session_time", ["vncSession", "uploadedAt"]),
});
