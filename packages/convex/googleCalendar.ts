"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const fetchEvents = action({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get OAuth token from Clerk Backend API
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY not configured in Convex environment variables");
    }

    // Fetch OAuth access token from Clerk using the correct endpoint
    // Provider is "oauth_google" for Google OAuth
    const tokenResponse = await fetch(
      `https://api.clerk.com/v1/users/${args.clerkUserId}/oauth_access_tokens/oauth_google`,
      {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
        },
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Clerk API error:", tokenResponse.status, error);
      throw new Error(
        `Clerk API error (${tokenResponse.status}): ${error}`
      );
    }

    const tokenData = await tokenResponse.json();
    console.log("Token data from Clerk:", JSON.stringify(tokenData, null, 2));

    // Try different response formats
    const accessToken = tokenData.data?.[0]?.token || tokenData[0]?.token || tokenData.token;

    if (!accessToken) {
      throw new Error(
        "No Google access token found. Please sign out and sign in again with Google, and make sure Calendar scope is enabled in Clerk."
      );
    }

    // Fetch events from Google Calendar (next 30 days)
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "500",
    });

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!calendarResponse.ok) {
      const error = await calendarResponse.json();
      throw new Error(error.error?.message || "Failed to fetch Google Calendar");
    }

    const data = await calendarResponse.json();
    return data.items || [];
  },
});

// Helper to get Google access token
async function getGoogleAccessToken(clerkUserId: string): Promise<string> {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    throw new Error("CLERK_SECRET_KEY not configured");
  }

  const tokenResponse = await fetch(
    `https://api.clerk.com/v1/users/${clerkUserId}/oauth_access_tokens/oauth_google`,
    {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
      },
    }
  );

  if (!tokenResponse.ok) {
    throw new Error("Failed to get Google access token");
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.data?.[0]?.token || tokenData[0]?.token || tokenData.token;

  if (!accessToken) {
    throw new Error("No Google access token found");
  }

  return accessToken;
}

// Helper to build RRULE from recurrence pattern
function buildRRule(
  pattern: "daily" | "weekly" | "monthly" | "yearly",
  endDate?: number
): string {
  const freqMap = {
    daily: "DAILY",
    weekly: "WEEKLY",
    monthly: "MONTHLY",
    yearly: "YEARLY",
  };

  let rrule = `RRULE:FREQ=${freqMap[pattern]}`;

  if (endDate) {
    // Format: UNTIL=20260131T235959Z
    const until = new Date(endDate);
    const untilStr = until.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    rrule += `;UNTIL=${untilStr}`;
  }

  return rrule;
}

// Create an event on Google Calendar
export const createEvent = action({
  args: {
    clerkUserId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(), // timestamp
    endDate: v.number(), // timestamp
    allDay: v.boolean(),
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
    const accessToken = await getGoogleAccessToken(args.clerkUserId);

    const startDateTime = new Date(args.startDate);
    const endDateTime = new Date(args.endDate);

    // Build event object based on whether it's all-day or timed
    const eventBody: any = {
      summary: args.title,
      description: args.description || "",
    };

    if (args.allDay) {
      // All-day events use date (not dateTime)
      eventBody.start = { date: startDateTime.toISOString().split("T")[0] };
      eventBody.end = { date: endDateTime.toISOString().split("T")[0] };
    } else {
      eventBody.start = { dateTime: startDateTime.toISOString() };
      eventBody.end = { dateTime: endDateTime.toISOString() };
    }

    // Add recurrence rule if this is a recurring event
    if (args.isRecurring && args.recurrencePattern) {
      eventBody.recurrence = [buildRRule(args.recurrencePattern, args.recurrenceEndDate)];
    }

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create Google Calendar event");
    }

    const createdEvent = await response.json();
    return {
      googleEventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink,
    };
  },
});

// Delete ALL events from Google Calendar (fetch and delete everything)
export const deleteAllEvents = action({
  args: {
    clerkUserId: v.string(),
    deleteRecurringSeries: v.boolean(),
  },
  handler: async (ctx, args) => {
    const accessToken = await getGoogleAccessToken(args.clerkUserId);

    // Fetch ALL events (past year to next year for comprehensive coverage)
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      timeMin: oneYearAgo.toISOString(),
      timeMax: oneYearLater.toISOString(),
      singleEvents: "true",
      maxResults: "2500",
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch events");
    }

    const data = await response.json();
    const events = data.items || [];

    // Get unique IDs to delete
    let idsToDelete: string[] = [];
    if (args.deleteRecurringSeries) {
      const baseIds = new Set<string>();
      for (const event of events) {
        if (!event.id) continue;
        // Extract base ID for recurring events
        const underscoreIndex = event.id.lastIndexOf("_");
        if (underscoreIndex > 0 && event.id.substring(underscoreIndex + 1).match(/^\d{8}T\d{6}Z$/)) {
          baseIds.add(event.id.substring(0, underscoreIndex));
        } else {
          baseIds.add(event.id);
        }
      }
      idsToDelete = Array.from(baseIds);
    } else {
      idsToDelete = events.map((e: any) => e.id).filter(Boolean);
    }

    // Delete each event
    let deleted = 0;
    for (const eventId of idsToDelete) {
      try {
        const deleteResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (deleteResponse.ok || deleteResponse.status === 404) {
          deleted++;
        }
      } catch (err) {
        console.warn(`Failed to delete ${eventId}:`, err);
      }
    }

    return { found: events.length, deleted };
  },
});

// Delete an event from Google Calendar
export const deleteEvent = action({
  args: {
    clerkUserId: v.string(),
    googleEventId: v.string(),
  },
  handler: async (ctx, args) => {
    const accessToken = await getGoogleAccessToken(args.clerkUserId);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${args.googleEventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 204 No Content is success, 404 means already deleted
    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`Failed to delete Google Calendar event: ${error}`);
    }

    return { success: true };
  },
});
