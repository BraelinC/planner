import { useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useAction, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { RefreshCw, Check, AlertCircle, Calendar, LogOut, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

export default function GoogleCalendarSync() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [showReconnect, setShowReconnect] = useState(false);

  const fetchGoogleEvents = useAction(api.googleCalendar.fetchEvents);
  const upsertGoogleEvent = useMutation(api.events.upsertGoogleEvent);
  const deleteAllLocalEvents = useMutation(api.events.deleteAll);
  const deleteAllGoogleEvents = useAction(api.googleCalendar.deleteAllEvents);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [deleteRecurringSeries, setDeleteRecurringSeries] = useState(true);

  // Get Google account from user's external accounts
  const googleAccount = user?.externalAccounts?.find(
    (account) => account.provider === "google"
  );

  // Clear all events (local + Google Calendar)
  const handleClearAllEvents = async () => {
    if (!user?.id) return;

    setIsClearing(true);
    try {
      // Delete all local events
      const localResult = await deleteAllLocalEvents({});

      // Delete all events directly from Google Calendar (fetches 1 year back/forward)
      let googleResult = { found: 0, deleted: 0 };
      try {
        googleResult = await deleteAllGoogleEvents({
          clerkUserId: user.id,
          deleteRecurringSeries,
        });
      } catch (err) {
        console.warn("Failed to delete from Google Calendar:", err);
      }

      setShowClearConfirm(false);
      setStatus("success");
      setMessage(
        `Deleted ${localResult.deleted} local events, ${googleResult.deleted} from Google Calendar`
      );
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    } catch (error) {
      console.error("Clear events error:", error);
      setStatus("error");
      setMessage("Failed to clear events");
    } finally {
      setIsClearing(false);
    }
  };

  // Force reconnect - sign out so user can sign back in with calendar scopes
  const handleReconnectGoogle = async () => {
    if (!googleAccount) return;

    try {
      // Destroy the Google connection - this removes it from Clerk
      await googleAccount.destroy();
      // Sign out completely so they have to sign in fresh
      await signOut();
      // Redirect to home - they'll need to sign in again
      window.location.href = "/";
    } catch (error) {
      console.error("Reconnect error:", error);
      // Fallback: just sign out
      await signOut();
      window.location.href = "/";
    }
  };

  // Request calendar permissions using reauthorize()
  const requestCalendarAccess = async () => {
    if (!googleAccount) {
      setStatus("error");
      setMessage("Please sign in with Google first");
      return;
    }

    setIsLoading(true);
    try {
      const reauth = await googleAccount.reauthorize({
        redirectUrl: window.location.href,
        additionalScopes: CALENDAR_SCOPES,
      });

      if (reauth?.verification?.externalVerificationRedirectURL) {
        // Redirect to Google to grant permissions
        window.location.href = reauth.verification.externalVerificationRedirectURL.href;
      }
    } catch (error) {
      console.error("Reauth error:", error);
      setStatus("error");
      setMessage("Failed to request calendar access");
      setIsLoading(false);
    }
  };

  const syncCalendar = async () => {
    if (!user?.id) {
      setStatus("error");
      setMessage("Not signed in");
      return;
    }

    if (!googleAccount) {
      setStatus("error");
      setMessage("Please sign in with Google");
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setMessage("");
    setNeedsAuth(false);

    try {
      // Fetch events from Google Calendar via Convex action
      const events: GoogleEvent[] = await fetchGoogleEvents({
        clerkUserId: user.id,
      });

      // Import events to our calendar (with deduplication)
      let created = 0;
      let updated = 0;
      for (const event of events) {
        if (!event.summary || !event.id) continue;

        const startDate = event.start?.dateTime || event.start?.date;
        const endDate = event.end?.dateTime || event.end?.date;
        const isAllDay = !event.start?.dateTime;

        if (startDate) {
          const result = await upsertGoogleEvent({
            googleEventId: event.id,
            title: event.summary,
            description: event.description,
            startDate: new Date(startDate).getTime(),
            endDate: endDate
              ? new Date(endDate).getTime()
              : new Date(startDate).getTime() + 60 * 60 * 1000,
            allDay: isAllDay,
            color: "#ec4899",
          });
          if (result.action === "created") created++;
          else if (result.action === "updated") updated++;
        }
      }

      setStatus("success");
      setMessage(`Synced: ${created} new, ${updated} updated`);
    } catch (error) {
      console.error("Google Calendar sync error:", error);
      setStatus("error");
      // Check if it's a permissions error
      const errorMsg = error instanceof Error ? error.message : "Failed to sync";
      if (errorMsg.includes("token") || errorMsg.includes("scope") || errorMsg.includes("Calendar")) {
        setNeedsAuth(true);
        setMessage("Calendar access needed");
      } else {
        setMessage(errorMsg);
      }
    } finally {
      setIsLoading(false);
      if (!needsAuth) {
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 5000);
      }
    }
  };

  // If no Google account connected at all
  if (!googleAccount) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Sign in with Google to sync calendar
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 md:gap-2">
      {needsAuth ? (
        <Button
          variant="outline"
          size="sm"
          onClick={requestCalendarAccess}
          disabled={isLoading}
          className="border-pink-300 bg-pink-50 hover:bg-pink-100 text-xs md:text-sm px-2 md:px-3"
        >
          {isLoading ? (
            <RefreshCw className="h-3 w-3 md:h-4 md:w-4 animate-spin md:mr-2" />
          ) : (
            <Calendar className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
          )}
          <span className="hidden md:inline">Grant Calendar Access</span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={syncCalendar}
          disabled={isLoading}
          className="border-pink-200 hover:bg-pink-50 text-xs md:text-sm px-2 md:px-3"
          title="Sync Google Calendar"
        >
          {isLoading ? (
            <RefreshCw className="h-3 w-3 md:h-4 md:w-4 animate-spin md:mr-2" />
          ) : status === "success" ? (
            <Check className="h-3 w-3 md:h-4 md:w-4 md:mr-2 text-green-500" />
          ) : status === "error" ? (
            <AlertCircle className="h-3 w-3 md:h-4 md:w-4 md:mr-2 text-red-500" />
          ) : (
            <RefreshCw className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
          )}
          <span className="hidden md:inline">Sync Google Calendar</span>
        </Button>
      )}
      {message && (
        <span
          className={`text-xs md:text-sm hidden sm:inline ${status === "error" ? "text-red-500" : "text-green-600"}`}
        >
          {message}
        </span>
      )}
      {showReconnect && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleReconnectGoogle}
          disabled={isLoading}
          title="Sign out and reconnect with calendar access"
          className="text-xs md:text-sm px-2 md:px-3"
        >
          <LogOut className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
          <span className="hidden md:inline">Reconnect Google</span>
        </Button>
      )}

      {/* Clear All Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowClearConfirm(true)}
        disabled={isLoading}
        title="Clear all events"
        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 md:h-8 md:w-8 p-0"
      >
        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
      </Button>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Clear All Events?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete ALL events from your planner calendar
              AND from your Google Calendar. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-sm text-red-700">
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
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
              </svg>
              Events will also be deleted from Google Calendar
            </div>

            <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded">
              <Checkbox
                id="deleteRecurring"
                checked={deleteRecurringSeries}
                onCheckedChange={(checked) => setDeleteRecurringSeries(checked as boolean)}
              />
              <Label htmlFor="deleteRecurring" className="text-sm font-medium text-amber-800 cursor-pointer">
                Delete entire recurring series (recommended)
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-1">
              When checked, deletes the whole recurring event series so they stop repeating.
              Otherwise, only individual instances are deleted.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAllEvents}
              disabled={isClearing}
            >
              {isClearing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete All Events"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
