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

// List all todos for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Create a new todo
export const create = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const now = Date.now();
    return await ctx.db.insert("todos", {
      userId: user._id,
      title: args.title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Toggle todo completion
export const toggle = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== user._id) {
      throw new Error("Todo not found");
    }

    await ctx.db.patch(args.id, {
      completed: !todo.completed,
      updatedAt: Date.now(),
    });
  },
});

// Update todo title
export const update = mutation({
  args: {
    id: v.id("todos"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== user._id) {
      throw new Error("Todo not found");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

// Delete a todo
export const remove = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== user._id) {
      throw new Error("Todo not found");
    }

    await ctx.db.delete(args.id);
  },
});
