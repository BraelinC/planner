import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate an upload URL for the client to upload directly to Convex storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save image metadata after upload
export const saveImage = mutation({
  args: {
    vncSession: v.string(),
    fileName: v.string(),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const imageId = await ctx.db.insert("pastedImages", {
      vncSession: args.vncSession,
      fileName: args.fileName,
      storageId: args.storageId,
      mimeType: args.mimeType,
      size: args.size,
      uploadedAt: Date.now(),
    });
    return imageId;
  },
});

// List images for a specific VNC session
export const listImages = query({
  args: {
    vncSession: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("pastedImages")
      .withIndex("by_session_time", (q) => q.eq("vncSession", args.vncSession))
      .order("desc")
      .take(args.limit ?? 50);

    // Get download URLs for each image
    const imagesWithUrls = await Promise.all(
      images.map(async (image) => {
        const url = await ctx.storage.getUrl(image.storageId);
        return { ...image, url };
      })
    );

    return imagesWithUrls;
  },
});

// List all images (for sync purposes)
export const listAllImages = query({
  args: {
    onlyUnsynced: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let images = await ctx.db.query("pastedImages").order("desc").collect();

    if (args.onlyUnsynced) {
      images = images.filter((img) => !img.syncedAt);
    }

    const imagesWithUrls = await Promise.all(
      images.map(async (image) => {
        const url = await ctx.storage.getUrl(image.storageId);
        return { ...image, url };
      })
    );

    return imagesWithUrls;
  },
});

// Mark image as synced
export const markSynced = mutation({
  args: {
    imageId: v.id("pastedImages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      syncedAt: Date.now(),
    });
  },
});

// Delete an image
export const deleteImage = mutation({
  args: {
    imageId: v.id("pastedImages"),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (image) {
      // Delete from storage
      await ctx.storage.delete(image.storageId);
      // Delete metadata
      await ctx.db.delete(args.imageId);
    }
  },
});

// Get image by ID with download URL
export const getImage = query({
  args: {
    imageId: v.id("pastedImages"),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) return null;

    const url = await ctx.storage.getUrl(image.storageId);
    return { ...image, url };
  },
});
