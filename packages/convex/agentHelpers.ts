import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Internal mutation to create event (bypasses auth for agent use)
export const internalCreateEvent = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    allDay: v.boolean(),
    color: v.optional(v.string()),
    googleEventId: v.optional(v.string()),
    isRecurring: v.optional(v.boolean()),
    recurrencePattern: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    )),
    recurrenceEndDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("events", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      allDay: args.allDay,
      color: args.color || "#ec4899",
      googleEventId: args.googleEventId,
      isRecurring: args.isRecurring,
      recurrencePattern: args.recurrencePattern,
      recurrenceEndDate: args.recurrenceEndDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation to create todo
export const internalCreateTodo = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("todos", {
      userId: args.userId,
      title: args.title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation to complete todo
export const internalCompleteTodo = internalMutation({
  args: {
    userId: v.id("users"),
    todoId: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.todoId);
    if (!todo || todo.userId !== args.userId) {
      throw new Error("Todo not found");
    }
    await ctx.db.patch(args.todoId, {
      completed: true,
      updatedAt: Date.now(),
    });
    return { success: true, title: todo.title };
  },
});

// Internal query to list upcoming events
export const internalListEvents = internalQuery({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return events.filter(
      (event) => event.startDate <= args.endDate && event.endDate >= args.startDate
    );
  },
});

// Internal query to list todos
export const internalListTodos = internalQuery({
  args: {
    userId: v.id("users"),
    includeCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.includeCompleted) {
      return todos;
    }
    return todos.filter((t) => !t.completed);
  },
});

// Internal query to get user by token identifier
export const internalGetUser = internalQuery({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .first();
  },
});

// Internal query to find events by title (for agent to identify events to delete)
export const internalFindEventsByTitle = internalQuery({
  args: {
    userId: v.id("users"),
    title: v.string(),
    dateHint: v.optional(v.number()), // Optional timestamp to narrow down results
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by title (case-insensitive partial match)
    const titleLower = args.title.toLowerCase();
    let matches = events.filter((e) => e.title.toLowerCase().includes(titleLower));

    // If dateHint is provided, further filter to events on that day
    if (args.dateHint) {
      const hintDate = new Date(args.dateHint);
      const dayStart = new Date(hintDate.getFullYear(), hintDate.getMonth(), hintDate.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      matches = matches.filter((e) => e.startDate >= dayStart && e.startDate < dayEnd);
    }

    return matches.map((e) => ({
      _id: e._id,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      googleEventId: e.googleEventId,
      isRecurring: e.isRecurring,
      recurrencePattern: e.recurrencePattern,
    }));
  },
});

// Internal mutation to delete an event
export const internalDeleteEvent = internalMutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) {
      throw new Error("Event not found");
    }
    const eventInfo = {
      title: event.title,
      googleEventId: event.googleEventId,
    };
    await ctx.db.delete(args.eventId);
    return { success: true, ...eventInfo };
  },
});
