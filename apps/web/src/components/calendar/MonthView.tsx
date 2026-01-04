import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@healthymama/convex";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import EventModal from "./EventModal";
import EventDetailModal from "./EventDetailModal";
import { Id } from "@healthymama/convex/dataModel";

interface MonthViewProps {
  currentDate: Date;
}

interface EventType {
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

export default function MonthView({ currentDate }: MonthViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const events = useQuery(api.events.list, {
    startDate: calendarStart.getTime(),
    endDate: calendarEnd.getTime(),
  });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDaysShort = ["S", "M", "T", "W", "T", "F", "S"];

  const getEventsForDay = (day: Date) => {
    if (!events) return [];
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      return isSameDay(eventStart, day);
    });
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: EventType, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent day click
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-7 gap-px bg-pink-200 rounded-lg overflow-hidden border border-pink-200">
        {/* Week day headers */}
        {weekDays.map((day, index) => (
          <div
            key={day}
            className="bg-pink-50 p-1 md:p-2 text-center text-xs md:text-sm font-medium text-pink-600"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{weekDaysShort[index]}</span>
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={cn(
                "bg-card min-h-[60px] md:min-h-[100px] p-1 md:p-2 cursor-pointer hover:bg-pink-50 transition-colors",
                !isSameMonth(day, currentDate) && "bg-pink-50/30 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center justify-center w-5 h-5 md:w-7 md:h-7 rounded-full text-xs md:text-sm",
                  isToday(day) && "bg-primary text-primary-foreground font-semibold"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-0.5 md:mt-1 space-y-0.5 md:space-y-1">
                {dayEvents.slice(0, isMobile ? 2 : 3).map((event) => (
                  <div
                    key={event._id}
                    onClick={(e) => handleEventClick(event as EventType, e)}
                    className="text-[10px] md:text-xs truncate px-0.5 md:px-1 py-0.5 rounded cursor-pointer hover:brightness-110 transition-all"
                    style={{ backgroundColor: event.color || "#ec4899", color: "white" }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > (isMobile ? 2 : 3) && (
                  <div className="text-[10px] md:text-xs text-muted-foreground">+{dayEvents.length - (isMobile ? 2 : 3)} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
      />

      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />
    </>
  );
}
