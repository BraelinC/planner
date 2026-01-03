"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

export const parseInput = action({
  args: {
    input: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });

    const now = new Date();
    const systemPrompt = `You are a helpful assistant that parses natural language into calendar events or tasks.

Current date/time: ${now.toISOString()}
User's timezone: ${args.timezone}

Rules:
1. If the input mentions a specific time or date, create a CALENDAR EVENT
2. If the input is just a task without a specific time, create a TODO
3. For events, infer reasonable durations (30 min for quick meetings, 1 hour for regular meetings)
4. Parse relative dates like "tomorrow", "next Monday", "in 2 hours"

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "type": "event" | "todo",
  "title": "string",
  "startDate": "ISO string or null",
  "endDate": "ISO string or null",
  "allDay": boolean
}

Examples:
- "Meeting with Sarah tomorrow at 2pm" → event with start 2pm tomorrow, end 2:30pm
- "Doctor appointment Friday 10am-11am" → event with those times
- "Buy groceries" → todo with no dates
- "Call mom on Sunday" → event, all day on Sunday
- "Finish report by Friday" → todo (it's a task with a deadline, not a scheduled event)`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-5-mini",
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: args.input },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    try {
      // Clean up the response in case there's markdown
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      // Fallback: create a simple todo
      return {
        type: "todo",
        title: args.input,
        startDate: null,
        endDate: null,
        allDay: false,
      };
    }
  },
});
