"use node";

import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, tool } from "ai";
import { z } from "zod";

// OpenRouter via OpenAI-compatible provider (properly handles tool schemas)
const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Main agent action - processes user input and executes tools
export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
      })
    ),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get user from database
    const user = await ctx.runQuery(internal.agentHelpers.internalGetUser, {
      tokenIdentifier: identity.subject,
    });
    if (!user) throw new Error("User not found");

    const now = new Date();
    const userId = user._id;
    // Extract Clerk user ID for Google Calendar sync (format: user_xxxxx from subject)
    const clerkUserId = identity.subject.includes("|")
      ? identity.subject.split("|")[1]
      : identity.subject;

    // Define tools with AI SDK v6 syntax (inputSchema with Zod)
    const tools = {
      createEvent: tool({
        description: `Create a calendar event. Use this when the user wants to schedule something at a specific time.
        Current date/time: ${now.toISOString()}. User timezone: ${args.timezone}.
        For relative dates like "tomorrow" or "next Monday", calculate the actual date.
        Default duration is 30 minutes for quick meetings, 1 hour for regular meetings.
        For recurring events, set isRecurring to true and specify the recurrencePattern.`,
        inputSchema: z.object({
          title: z.string().describe("The event title"),
          startDate: z.string().describe("ISO 8601 date string for when the event starts"),
          endDate: z.string().describe("ISO 8601 date string for when the event ends"),
          allDay: z.boolean().describe("Whether this is an all-day event"),
          description: z.string().optional().describe("Optional event description"),
          isRecurring: z.boolean().optional().describe("Whether this is a recurring event"),
          recurrencePattern: z.enum(["daily", "weekly", "monthly", "yearly"]).optional().describe("How often the event repeats"),
          recurrenceEndDate: z.string().optional().describe("ISO 8601 date string for when the recurrence ends (optional)"),
        }),
        execute: async ({ title, startDate, endDate, allDay, description, isRecurring, recurrencePattern, recurrenceEndDate }) => {
          const startTimestamp = new Date(startDate).getTime();
          const endTimestamp = new Date(endDate).getTime();
          const recurrenceEndTimestamp = recurrenceEndDate ? new Date(recurrenceEndDate).getTime() : undefined;

          // Create event in local database
          const eventId = await ctx.runMutation(internal.agentHelpers.internalCreateEvent, {
            userId,
            title,
            description,
            startDate: startTimestamp,
            endDate: endTimestamp,
            allDay,
            isRecurring,
            recurrencePattern,
            recurrenceEndDate: recurrenceEndTimestamp,
          });

          // Also sync to Google Calendar
          let googleEventId: string | undefined;
          try {
            const googleResult = await ctx.runAction(api.googleCalendar.createEvent, {
              clerkUserId,
              title,
              description,
              startDate: startTimestamp,
              endDate: endTimestamp,
              allDay,
              isRecurring,
              recurrencePattern,
              recurrenceEndDate: recurrenceEndTimestamp,
            });
            googleEventId = googleResult.googleEventId;
          } catch (error) {
            console.warn("Failed to sync to Google Calendar:", error);
          }

          let message = `Created event "${title}" on ${new Date(startDate).toLocaleDateString()}`;
          if (isRecurring && recurrencePattern) {
            message += ` (repeats ${recurrencePattern}`;
            if (recurrenceEndDate) {
              message += ` until ${new Date(recurrenceEndDate).toLocaleDateString()}`;
            }
            message += ")";
          }
          if (googleEventId) {
            message += " - synced to Google Calendar";
          }

          return {
            success: true,
            eventId,
            googleEventId,
            message,
          };
        },
      }),

      createTodo: tool({
        description: `Create a to-do task. Use this when the user wants to add something to their task list without a specific scheduled time.
        Examples: "buy groceries", "finish report", "call mom"`,
        inputSchema: z.object({
          title: z.string().describe("The task title"),
        }),
        execute: async ({ title }) => {
          const todoId = await ctx.runMutation(internal.agentHelpers.internalCreateTodo, {
            userId,
            title,
          });
          return {
            success: true,
            todoId,
            message: `Added task: "${title}"`,
          };
        },
      }),

      listUpcomingEvents: tool({
        description: `List upcoming calendar events. Use this to check what's on the calendar before scheduling something new, or when the user asks about their schedule.`,
        inputSchema: z.object({
          daysAhead: z.number().default(7).describe("How many days ahead to look (default 7)"),
        }),
        execute: async ({ daysAhead }) => {
          const startDate = now.getTime();
          const endDate = now.getTime() + daysAhead * 24 * 60 * 60 * 1000;

          const events = await ctx.runQuery(internal.agentHelpers.internalListEvents, {
            userId,
            startDate,
            endDate,
          });

          if (events.length === 0) {
            return { events: [], message: `No events in the next ${daysAhead} days` };
          }

          const formatted = events.map((e: any) => ({
            title: e.title,
            start: new Date(e.startDate).toLocaleString(),
            allDay: e.allDay,
          }));

          return {
            events: formatted,
            message: `Found ${events.length} event(s) in the next ${daysAhead} days`,
          };
        },
      }),

      listTodos: tool({
        description: `List current to-do tasks. Use this when the user asks about their tasks or wants to see what needs to be done.`,
        inputSchema: z.object({
          includeCompleted: z.boolean().default(false).describe("Whether to include completed tasks"),
        }),
        execute: async ({ includeCompleted }) => {
          const todos = await ctx.runQuery(internal.agentHelpers.internalListTodos, {
            userId,
            includeCompleted,
          });

          if (todos.length === 0) {
            return { todos: [], message: "No tasks found" };
          }

          const formatted = todos.map((t: any) => ({
            id: t._id,
            title: t.title,
            completed: t.completed,
          }));

          return {
            todos: formatted,
            message: `Found ${todos.length} task(s)`,
          };
        },
      }),

      completeTodo: tool({
        description: `Mark a to-do task as completed. Use this when the user says they finished a task.`,
        inputSchema: z.object({
          todoId: z.string().describe("The ID of the todo to complete"),
        }),
        execute: async ({ todoId }): Promise<{ success: boolean; message: string }> => {
          try {
            const result: { success: boolean; title: string } = await ctx.runMutation(internal.agentHelpers.internalCompleteTodo, {
              userId,
              todoId: todoId as any,
            });
            return {
              success: true,
              message: `Completed task: "${result.title}"`,
            };
          } catch (error) {
            return {
              success: false,
              message: "Could not find that task",
            };
          }
        },
      }),

      findEvents: tool({
        description: `Search for events by title. Use this to find events before deleting them, or when the user asks about a specific event.
        Returns a list of matching events with their IDs.`,
        inputSchema: z.object({
          title: z.string().describe("The event title to search for (partial match, case-insensitive)"),
          date: z.string().optional().describe("Optional ISO 8601 date string to narrow results to a specific day"),
        }),
        execute: async ({ title, date }): Promise<{ events: any[]; message: string }> => {
          const dateHint = date ? new Date(date).getTime() : undefined;
          const events: any[] = await ctx.runQuery(internal.agentHelpers.internalFindEventsByTitle, {
            userId,
            title,
            dateHint,
          });

          if (events.length === 0) {
            return { events: [], message: `No events found matching "${title}"` };
          }

          const formatted: any[] = events.map((e) => ({
            id: e._id,
            title: e.title,
            date: new Date(e.startDate).toLocaleDateString(),
            time: new Date(e.startDate).toLocaleTimeString(),
            isRecurring: e.isRecurring,
          }));

          return {
            events: formatted,
            message: `Found ${events.length} event(s) matching "${title}"`,
          };
        },
      }),

      deleteEvent: tool({
        description: `Delete a calendar event. First use findEvents to get the event ID, then use this tool to delete it.
        This will also remove it from Google Calendar if it was synced.`,
        inputSchema: z.object({
          eventId: z.string().describe("The ID of the event to delete (get this from findEvents)"),
        }),
        execute: async ({ eventId }): Promise<{ success: boolean; message: string }> => {
          try {
            // Delete from local database
            const result: { success: boolean; title: string; googleEventId?: string } = await ctx.runMutation(internal.agentHelpers.internalDeleteEvent, {
              userId,
              eventId: eventId as any,
            });

            // Also delete from Google Calendar if it has a googleEventId
            if (result.googleEventId) {
              try {
                await ctx.runAction(api.googleCalendar.deleteEvent, {
                  clerkUserId,
                  googleEventId: result.googleEventId,
                });
              } catch (error) {
                console.warn("Failed to delete from Google Calendar:", error);
              }
            }

            return {
              success: true,
              message: `Deleted event: "${result.title}"${result.googleEventId ? " (also removed from Google Calendar)" : ""}`,
            };
          } catch (error) {
            return {
              success: false,
              message: "Could not find or delete that event. Use findEvents first to get the correct event ID.",
            };
          }
        },
      }),
    };

    // System prompt for the agent
    const systemPrompt = `You are a helpful personal assistant for a planner app. You help users manage their calendar events and to-do tasks.

Current date/time: ${now.toISOString()}
User's timezone: ${args.timezone}

You have access to tools to:
- Create calendar events (with specific times, including recurring events)
- Create to-do tasks (no specific time)
- List upcoming events
- List to-do tasks
- Complete tasks
- Find events by title (useful before deleting)
- Delete events (also removes from Google Calendar)

DELETING EVENTS:
When the user wants to delete an event, use findEvents first with the event title (and optionally date) to find matching events.
Then use deleteEvent with the event ID to delete it. If multiple events match, ask the user which one to delete.

IMPORTANT - Ask for missing information before creating events:
- If the user doesn't specify a DATE, ask "What date should I schedule this for?"
- If the user doesn't specify a TIME for a non-all-day event, ask "What time should this event start?"
- If the user doesn't specify DURATION, suggest a default: "I'll set this for 30 minutes. Is that okay, or would you prefer a different duration?"
- For RECURRING events, always ask:
  1. "How long should each event last?" (if not specified)
  2. "When should the recurrence end?" or offer "Should this repeat indefinitely, or until a specific date?"

Guidelines:
1. For requests like "meeting tomorrow at 3pm", use createEvent
2. For requests like "buy groceries" or "finish report", use createTodo
3. Before scheduling, you can check the calendar with listUpcomingEvents
4. Be concise but friendly in your responses
5. After using a tool, confirm what you did
6. Events are synced to Google Calendar automatically

When parsing dates:
- "tomorrow" = the next day
- "next Monday" = the coming Monday
- "in 2 hours" = 2 hours from now
- If no end time is given, default to 30 min for quick items, 1 hour for meetings`;

    // Build messages with system prompt
    const fullMessages = [
      { role: "system" as const, content: systemPrompt },
      ...args.messages,
    ];

    // Use generateText with tools for multi-step execution
    try {
      const result: any = await generateText({
        model: openrouter("openai/gpt-4o-mini"),
        messages: fullMessages,
        tools,
        maxSteps: 5,
      } as any);

      // Return the final response and any tool results
      const toolResults: Array<{ toolName: string; result: any }> = [];
      if (result.steps) {
        for (const step of result.steps) {
          if (step.toolResults) {
            for (const tr of step.toolResults) {
              toolResults.push({
                toolName: tr.toolName,
                result: tr.result,
              });
            }
          }
        }
      }

      return {
        text: result.text,
        toolResults,
      };
    } catch (error: any) {
      console.error("OpenRouter error details:", JSON.stringify(error, null, 2));
      console.error("Error message:", error.message);
      console.error("Error cause:", error.cause);
      throw error;
    }
  },
});
