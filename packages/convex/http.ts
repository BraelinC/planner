import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle CORS preflight
http.route({
  path: "/api/tasks",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// GET /api/tasks - List all tasks
http.route({
  path: "/api/tasks",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const tasks = await ctx.runQuery(api.dashboard.listTasks, {});
    return new Response(JSON.stringify(tasks), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// POST /api/tasks - Create task
http.route({
  path: "/api/tasks",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const id = await ctx.runMutation(api.dashboard.createTask, {
      title: body.title,
      priority: body.priority || "medium",
      category: body.category,
      description: body.description,
      createdBy: body.createdBy || "claude-http",
    });
    return new Response(JSON.stringify({ id }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// GET /api/instances - List all instances
http.route({
  path: "/api/instances",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const instances = await ctx.runQuery(api.dashboard.listInstances, {});
    return new Response(JSON.stringify(instances), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// POST /api/instances/register - Register Claude instance
http.route({
  path: "/api/instances/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const id = await ctx.runMutation(api.dashboard.registerInstance, {
      name: body.name,
      pid: body.pid,
      metadata: body.metadata,
    });
    return new Response(JSON.stringify({ id }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// POST /api/instances/heartbeat - Send heartbeat
http.route({
  path: "/api/instances/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    await ctx.runMutation(api.dashboard.heartbeat, {
      name: body.name,
      ramUsage: body.ramUsage,
      status: body.status,
    });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// GET /api/commands - List commands
http.route({
  path: "/api/commands",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const instanceName = url.searchParams.get("instance") || undefined;
    const limit = url.searchParams.get("limit");
    const commands = await ctx.runQuery(api.dashboard.listCommands, {
      instanceName,
      limit: limit ? parseInt(limit) : undefined,
    });
    return new Response(JSON.stringify(commands), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// POST /api/commands - Create command
http.route({
  path: "/api/commands",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const id = await ctx.runMutation(api.dashboard.createCommand, {
      instanceName: body.instanceName,
      command: body.command,
    });
    return new Response(JSON.stringify({ id }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// ============ DEBUG: List all users ============
http.route({
  path: "/api/debug/users",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const users = await ctx.runQuery(api.users.listAllUsers, {});
    return new Response(JSON.stringify(users), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// ============ USER TODOS (with Clerk User ID) ============

// POST /api/user/todos - Create todo for a specific Clerk user
http.route({
  path: "/api/user/todos",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const clerkUserId = body.clerkUserId; // e.g., "user_37m7i6n3Sqb0rIgZaBc0EUjXdNp"
    const title = body.title;

    if (!clerkUserId || !title) {
      return new Response(JSON.stringify({ error: "clerkUserId and title required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Find user by Clerk tokenIdentifier
    const user = await ctx.runQuery(api.users.getUserByClerkId, { clerkUserId });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create todo
    const id = await ctx.runMutation(api.dashboard.createUserTodo, {
      userId: user._id,
      title,
    });

    return new Response(JSON.stringify({ id, userId: user._id }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// GET /api/user/todos - List todos for a specific Clerk user
http.route({
  path: "/api/user/todos",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get("clerkUserId");

    if (!clerkUserId) {
      return new Response(JSON.stringify({ error: "clerkUserId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const user = await ctx.runQuery(api.users.getUserByClerkId, { clerkUserId });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const todos = await ctx.runQuery(api.dashboard.listUserTodos, { userId: user._id });
    return new Response(JSON.stringify(todos), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// ============ PASTED IMAGES API ============

// CORS preflight for images endpoints
http.route({
  path: "/api/images",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

http.route({
  path: "/api/images/upload",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

http.route({
  path: "/api/images/sync",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// GET /api/images - List images for a VNC session
http.route({
  path: "/api/images",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const vncSession = url.searchParams.get("session");
    const limit = url.searchParams.get("limit");

    if (!vncSession) {
      return new Response(JSON.stringify({ error: "session parameter required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const images = await ctx.runQuery(api.pastedImages.listImages, {
      vncSession,
      limit: limit ? parseInt(limit) : undefined,
    });

    return new Response(JSON.stringify(images), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// POST /api/images/upload - Get upload URL and save metadata
http.route({
  path: "/api/images/upload",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { vncSession, fileName, mimeType, size } = body;

    if (!vncSession || !fileName || !mimeType) {
      return new Response(JSON.stringify({ error: "vncSession, fileName, and mimeType required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate upload URL
    const uploadUrl = await ctx.runMutation(api.pastedImages.generateUploadUrl, {});

    return new Response(JSON.stringify({ uploadUrl, vncSession, fileName }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// POST /api/images/save - Save image metadata after upload
http.route({
  path: "/api/images/save",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

http.route({
  path: "/api/images/save",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { vncSession, fileName, storageId, mimeType, size } = body;

    if (!vncSession || !fileName || !storageId || !mimeType || size === undefined) {
      return new Response(JSON.stringify({ error: "All fields required: vncSession, fileName, storageId, mimeType, size" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const imageId = await ctx.runMutation(api.pastedImages.saveImage, {
      vncSession,
      fileName,
      storageId,
      mimeType,
      size,
    });

    return new Response(JSON.stringify({ imageId }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// GET /api/images/sync - Get unsynced images for sync script
http.route({
  path: "/api/images/sync",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const vncSession = url.searchParams.get("session");
    const onlyUnsynced = url.searchParams.get("unsynced") === "true";

    let images;
    if (vncSession) {
      images = await ctx.runQuery(api.pastedImages.listImages, { vncSession });
      if (onlyUnsynced) {
        images = images.filter((img: any) => !img.syncedAt);
      }
    } else {
      images = await ctx.runQuery(api.pastedImages.listAllImages, { onlyUnsynced });
    }

    return new Response(JSON.stringify(images), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// POST /api/images/mark-synced - Mark image as synced
http.route({
  path: "/api/images/mark-synced",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

http.route({
  path: "/api/images/mark-synced",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return new Response(JSON.stringify({ error: "imageId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await ctx.runMutation(api.pastedImages.markSynced, { imageId });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// DELETE /api/images - Delete an image
http.route({
  path: "/api/images",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return new Response(JSON.stringify({ error: "imageId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await ctx.runMutation(api.pastedImages.deleteImage, { imageId });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

export default http;
