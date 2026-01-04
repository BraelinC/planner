import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    return user;
  },
});

// Setup user after first OAuth login
export const upsertUser = mutation({
  args: {
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();

    // Look up existing user by tokenIdentifier
    let user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) {
      // Create new user
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: identity.subject,
        email: args.email || identity.email,
        name: identity.name,
        firstName: args.firstName,
        lastName: args.lastName,
        profileImageUrl: args.profileImageUrl || identity.pictureUrl,
        createdAt: now,
        updatedAt: now,
      });
      return userId;
    } else {
      // Update existing user
      await ctx.db.patch(user._id, {
        email: args.email || user.email,
        firstName: args.firstName || user.firstName,
        lastName: args.lastName || user.lastName,
        profileImageUrl: args.profileImageUrl || user.profileImageUrl,
        updatedAt: now,
      });
      return user._id;
    }
  },
});
