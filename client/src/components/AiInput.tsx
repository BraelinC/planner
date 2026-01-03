import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useAction, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Calendar, CheckSquare, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

interface ParsedEvent {
  type: "event" | "todo";
  title: string;
  startDate: string | null;
  endDate: string | null;
  allDay: boolean;
}

export default function AiInput() {
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingEvent, setPendingEvent] = useState<ParsedEvent | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const parseInput = useAction(api.ai.parseInput);
  const createEvent = useMutation(api.events.create);
  const createTodo = useMutation(api.todos.create);
  const createGoogleEvent = useAction(api.googleCalendar.createEvent);
  const upsertGoogleEvent = useMutation(api.events.upsertGoogleEvent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await parseInput({ input: input.trim(), timezone });

      // Show preview modal instead of creating immediately
      setPendingEvent(result);
      setShowPreview(true);
    } catch (error) {
      console.error("AI parsing error:", error);
      setFeedback("Something went wrong. Try again!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!pendingEvent) return;

    setIsCreating(true);

    try {
      if (pendingEvent.type === "event") {
        const startDate = pendingEvent.startDate
          ? new Date(pendingEvent.startDate).getTime()
          : Date.now();
        const endDate = pendingEvent.endDate
          ? new Date(pendingEvent.endDate).getTime()
          : startDate + 30 * 60 * 1000;

        // Create on Google Calendar first (if user has Google connected)
        let googleEventId: string | undefined;
        if (user?.id) {
          try {
            const googleResult = await createGoogleEvent({
              clerkUserId: user.id,
              title: pendingEvent.title,
              startDate,
              endDate,
              allDay: pendingEvent.allDay || false,
            });
            googleEventId = googleResult.googleEventId;
          } catch (err) {
            console.warn("Failed to create on Google Calendar:", err);
            // Continue anyway - create locally
          }
        }

        // Create locally (with Google ID if we got one)
        if (googleEventId) {
          await upsertGoogleEvent({
            googleEventId,
            title: pendingEvent.title,
            startDate,
            endDate,
            allDay: pendingEvent.allDay || false,
            color: "#ec4899",
          });
        } else {
          await createEvent({
            title: pendingEvent.title,
            startDate,
            endDate,
            allDay: pendingEvent.allDay || false,
            color: "#ec4899",
          });
        }

        setFeedback(`✓ Event created: "${pendingEvent.title}"${googleEventId ? " (synced to Google)" : ""}`);
      } else {
        await createTodo({ title: pendingEvent.title });
        setFeedback(`✓ Task added: "${pendingEvent.title}"`);
      }

      setInput("");
      setShowPreview(false);
      setPendingEvent(null);
    } catch (error) {
      console.error("Creation error:", error);
      setFeedback("Failed to create. Try again!");
    } finally {
      setIsCreating(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setPendingEvent(null);
  };

  const formatDateTime = (dateStr: string | null, allDay: boolean) => {
    if (!dateStr) return "Not specified";
    const date = new Date(dateStr);
    if (allDay) {
      return format(date, "EEEE, MMMM d, yyyy");
    }
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try: 'Meeting tomorrow at 3pm' or 'Buy groceries'"
            className="pl-10 border-pink-200 focus:border-pink-400"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-pink-500 hover:bg-pink-600"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
        </Button>
      </form>
      {feedback && (
        <p className="mt-2 text-sm text-pink-600 animate-in fade-in">{feedback}</p>
      )}

      {/* Preview/Approval Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingEvent?.type === "event" ? (
                <>
                  <Calendar className="h-5 w-5 text-pink-500" />
                  New Event
                </>
              ) : (
                <>
                  <CheckSquare className="h-5 w-5 text-pink-500" />
                  New Task
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {pendingEvent && (
            <div className="py-4 space-y-4">
              {/* Title */}
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {pendingEvent.title}
                </h3>
              </div>

              {/* Event details */}
              {pendingEvent.type === "event" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock className="h-4 w-4 text-pink-400" />
                    <div>
                      <div className="text-sm font-medium">
                        {formatDateTime(pendingEvent.startDate, pendingEvent.allDay)}
                      </div>
                      {!pendingEvent.allDay && pendingEvent.endDate && (
                        <div className="text-xs text-gray-500">
                          to {format(new Date(pendingEvent.endDate), "h:mm a")}
                        </div>
                      )}
                    </div>
                  </div>
                  {pendingEvent.allDay && (
                    <div className="flex items-center gap-2 text-sm text-pink-600">
                      <span className="px-2 py-0.5 bg-pink-100 rounded text-xs font-medium">
                        All day
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Sync info */}
              {pendingEvent.type === "event" && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Will sync to Google Calendar
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isCreating}
              className="bg-pink-500 hover:bg-pink-600"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>Confirm</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
