import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to get current user
async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q: any) => q.eq("tokenIdentifier", identity.subject))
    .first();
}

// List events for the current user within a date range
export const list = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter by date range
    return events.filter(
      (event) => event.startDate <= args.endDate && event.endDate >= args.startDate
    );
  },
});

// Create a new event
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    allDay: v.boolean(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const now = Date.now();
    return await ctx.db.insert("events", {
      userId: user._id,
      title: args.title,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      allDay: args.allDay,
      color: args.color,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an event
export const update = mutation({
  args: {
    id: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.id);
    if (!event || event.userId !== user._id) {
      throw new Error("Event not found");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete an event
export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.id);
    if (!event || event.userId !== user._id) {
      throw new Error("Event not found");
    }

    await ctx.db.delete(args.id);
  },
});

// Delete ALL events for the current user
export const deleteAll = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Collect Google event IDs before deleting
    const googleEventIds: string[] = [];
    let deleted = 0;

    for (const event of events) {
      if (event.googleEventId) {
        googleEventIds.push(event.googleEventId);
      }
      await ctx.db.delete(event._id);
      deleted++;
    }

    return { deleted, googleEventIds };
  },
});

// Create or update a Google Calendar event (with deduplication)
export const upsertGoogleEvent = mutation({
  args: {
    googleEventId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    allDay: v.boolean(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    // Check if event already exists
    const existing = await ctx.db
      .query("events")
      .withIndex("by_google_event", (q) =>
        q.eq("userId", user._id).eq("googleEventId", args.googleEventId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing event
      await ctx.db.patch(existing._id, {
        title: args.title,
        description: args.description,
        startDate: args.startDate,
        endDate: args.endDate,
        allDay: args.allDay,
        color: args.color,
        updatedAt: now,
      });
      return { action: "updated", id: existing._id };
    } else {
      // Create new event
      const id = await ctx.db.insert("events", {
        userId: user._id,
        googleEventId: args.googleEventId,
        title: args.title,
        description: args.description,
        startDate: args.startDate,
        endDate: args.endDate,
        allDay: args.allDay,
        color: args.color,
        createdAt: now,
        updatedAt: now,
      });
      return { action: "created", id };
    }
  },
});
