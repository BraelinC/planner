import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ TASKS ============

export const listTasks = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"))),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tasks;
    if (args.status) {
      tasks = await ctx.db.query("claudeTasks").withIndex("by_status", (q) => q.eq("status", args.status!)).collect();
    } else if (args.category) {
      tasks = await ctx.db.query("claudeTasks").withIndex("by_category", (q) => q.eq("category", args.category!)).collect();
    } else {
      tasks = await ctx.db.query("claudeTasks").collect();
    }
    return tasks.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const createTask = mutation({
  args: {
    title: v.string(),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("claudeTasks", {
      title: args.title,
      status: "pending",
      priority: args.priority,
      category: args.category,
      description: args.description,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTask = mutation({
  args: {
    id: v.id("claudeTasks"),
    status: v.optional(v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"))),
    priority: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
    category: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
  },
});

export const deleteTask = mutation({
  args: { id: v.id("claudeTasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ============ INSTANCES ============

export const listInstances = query({
  args: {},
  handler: async (ctx) => {
    const instances = await ctx.db.query("claudeInstances").collect();
    // Mark instances as offline if no heartbeat in 60 seconds
    const now = Date.now();
    return instances.map((inst) => ({
      ...inst,
      status: now - inst.lastHeartbeat > 60000 ? "offline" : inst.status,
    }));
  },
});

export const registerInstance = mutation({
  args: {
    name: v.string(),
    pid: v.optional(v.number()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if instance already exists
    const existing = await ctx.db
      .query("claudeInstances")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    const now = Date.now();
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        pid: args.pid,
        status: "active",
        lastHeartbeat: now,
        metadata: args.metadata,
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("claudeInstances", {
        name: args.name,
        pid: args.pid,
        status: "active",
        lastHeartbeat: now,
        startedAt: now,
        metadata: args.metadata,
      });
    }
  },
});

export const heartbeat = mutation({
  args: {
    name: v.string(),
    ramUsage: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("idle"), v.literal("offline"))),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db
      .query("claudeInstances")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (instance) {
      await ctx.db.patch(instance._id, {
        lastHeartbeat: Date.now(),
        ramUsage: args.ramUsage,
        status: args.status || "active",
      });
    }
  },
});

export const unregisterInstance = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const instance = await ctx.db
      .query("claudeInstances")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (instance) {
      await ctx.db.delete(instance._id);
    }
  },
});

// ============ COMMANDS ============

export const listCommands = query({
  args: {
    instanceName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let commands;
    if (args.instanceName) {
      commands = await ctx.db
        .query("claudeCommands")
        .withIndex("by_instance", (q) => q.eq("instanceName", args.instanceName!))
        .collect();
    } else {
      commands = await ctx.db.query("claudeCommands").collect();
    }
    const sorted = commands.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

export const createCommand = mutation({
  args: {
    instanceName: v.string(),
    command: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("claudeCommands", {
      instanceName: args.instanceName,
      command: args.command,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateCommand = mutation({
  args: {
    id: v.id("claudeCommands"),
    status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("error")),
    output: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      output: args.output,
    });
  },
});
