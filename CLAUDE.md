# CLAUDE.md - Planner Project

## Overview

A calendar/planner app with a **Claude Dashboard** for AI agent task management. Built with:
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Convex (real-time database)
- **Auth**: Clerk (Google OAuth)

## For Claude Instances: HTTP API

Any Claude instance can interact with this planner via HTTP API at:

**Base URL**: `https://joyous-armadillo-272.convex.site`

### Claude Tasks API

```bash
# List all tasks
curl https://joyous-armadillo-272.convex.site/api/tasks

# Create a task
curl -X POST https://joyous-armadillo-272.convex.site/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Task name","priority":"high","category":"optional","description":"optional"}'

# Priority: "high" | "medium" | "low"
```

### Instance Registration

```bash
# Register your instance
curl -X POST https://joyous-armadillo-272.convex.site/api/instances/register \
  -H "Content-Type: application/json" \
  -d '{"name":"claude-instance-1","pid":12345,"metadata":"{\"project\":\"my-project\"}"}'

# Send heartbeat
curl -X POST https://joyous-armadillo-272.convex.site/api/instances/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"name":"claude-instance-1","status":"active","ramUsage":500}'

# List instances
curl https://joyous-armadillo-272.convex.site/api/instances
```

### Command Queue

```bash
# Create command for an instance
curl -X POST https://joyous-armadillo-272.convex.site/api/commands \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"claude-instance-1","command":"screenshot"}'

# List commands
curl https://joyous-armadillo-272.convex.site/api/commands?instance=claude-instance-1&limit=10
```

### User Todos (with Clerk authentication)

```bash
# Create todo for a specific Clerk user
curl -X POST https://joyous-armadillo-272.convex.site/api/user/todos \
  -H "Content-Type: application/json" \
  -d '{"clerkUserId":"user_xxxxx","title":"My todo"}'

# List user's todos
curl "https://joyous-armadillo-272.convex.site/api/user/todos?clerkUserId=user_xxxxx"
```

## Project Structure

```
planner/
├── apps/
│   └── web/                    # React frontend
│       └── src/
│           ├── components/
│           │   └── dashboard/
│           │       └── ClaudeDashboard.tsx  # Claude task UI
│           └── pages/
│               └── Home.tsx    # Main app with Calendar/Claude tabs
├── packages/
│   └── convex/                 # Convex backend
│       ├── schema.ts           # Database schema
│       ├── dashboard.ts        # Claude dashboard mutations/queries
│       ├── http.ts             # HTTP API endpoints
│       └── users.ts            # User queries
└── CLAUDE.md                   # This file
```

## Database Schema (claudeTasks)

```typescript
claudeTasks: {
  title: string,
  status: "pending" | "in_progress" | "completed",
  priority: "high" | "medium" | "low",
  category?: string,
  description?: string,
  createdBy?: string,  // instance name
  createdAt: number,
  updatedAt: number,
}
```

## Running Locally

```bash
# Install dependencies
bun install

# Start Convex dev server (in one terminal)
bunx convex dev

# Start web app (in another terminal)
bun run dev:web
# Opens at http://localhost:5173
```

## Convex URLs

| Environment | URL |
|-------------|-----|
| API | https://joyous-armadillo-272.convex.cloud |
| HTTP | https://joyous-armadillo-272.convex.site |

## Best Practices for Claude Instances

1. **Register on startup**: Call `/api/instances/register` when your session starts
2. **Send heartbeats**: Call `/api/instances/heartbeat` every 30-60 seconds
3. **Create tasks for tracking**: Add tasks to `/api/tasks` for work you're doing
4. **Use meaningful names**: Include project or purpose in instance name
5. **Add category**: Group related tasks with category field

## Example: Full Claude Instance Integration

```javascript
const CONVEX_HTTP = "https://joyous-armadillo-272.convex.site";
const INSTANCE_NAME = `claude-${process.env.PROJECT || 'unknown'}-${process.pid}`;

// Register on startup
await fetch(`${CONVEX_HTTP}/api/instances/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: INSTANCE_NAME, pid: process.pid })
});

// Heartbeat every 30s
setInterval(async () => {
  await fetch(`${CONVEX_HTTP}/api/instances/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: INSTANCE_NAME, status: "active" })
  });
}, 30000);

// Create a task
await fetch(`${CONVEX_HTTP}/api/tasks`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Implement feature X",
    priority: "high",
    category: "development",
    createdBy: INSTANCE_NAME
  })
});
```

## Constraints

- CORS is enabled for all origins
- No authentication required for HTTP API (public endpoints)
- Tasks are shared across all instances
- User todos require valid Clerk user ID
