import { useMutation } from "convex/react";
import { api } from "@healthymama/convex";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Clock, Repeat, Trash2 } from "lucide-react";
import { Id } from "@healthymama/convex/dataModel";

interface Event {
  _id: Id<"events">;
  title: string;
  description?: string;
  startDate: number;
  endDate: number;
  allDay: boolean;
  color?: string;
  isRecurring?: boolean;
  recurrencePattern?: "daily" | "weekly" | "monthly" | "yearly";
  recurrenceEndDate?: number;
}

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

export default function EventDetailModal({ isOpen, onClose, event }: EventDetailModalProps) {
  const deleteEvent = useMutation(api.events.remove);

  if (!event) return null;

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this event?")) {
      await deleteEvent({ id: event._id });
      onClose();
    }
  };

  const formatTime = (date: Date) => format(date, "h:mm a");
  const formatDate = (date: Date) => format(date, "EEEE, MMMM d, yyyy");

  const getRecurrenceText = () => {
    if (!event.isRecurring || !event.recurrencePattern) return null;
    const patternText = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
    }[event.recurrencePattern];

    if (event.recurrenceEndDate) {
      return `${patternText} until ${format(new Date(event.recurrenceEndDate), "MMM d, yyyy")}`;
    }
    return patternText;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.color || "#ec4899" }}
            />
            <DialogTitle className="text-xl">{event.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date */}
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar className="h-5 w-5 text-pink-500" />
            <span>{formatDate(startDate)}</span>
          </div>

          {/* Time */}
          {!event.allDay && (
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="h-5 w-5 text-pink-500" />
              <span>
                {formatTime(startDate)} - {formatTime(endDate)}
              </span>
            </div>
          )}

          {event.allDay && (
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="h-5 w-5 text-pink-500" />
              <span>All day</span>
            </div>
          )}

          {/* Recurrence */}
          {event.isRecurring && (
            <div className="flex items-center gap-3 text-gray-700">
              <Repeat className="h-5 w-5 text-pink-500" />
              <span>{getRecurrenceText()}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="pt-2 border-t">
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
