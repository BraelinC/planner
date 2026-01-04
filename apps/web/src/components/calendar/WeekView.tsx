import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@healthymama/convex";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  setHours,
  differenceInMinutes,
  startOfDay,
  addDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EventModal from "./EventModal";
import EventDetailModal from "./EventDetailModal";
import { Id } from "@healthymama/convex/dataModel";

interface WeekViewProps {
  currentDate: Date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels per hour

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

export default function WeekView({ currentDate }: WeekViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileStartIndex, setMobileStartIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset mobile index when currentDate changes
  useEffect(() => {
    // Start from today's position in the week
    const weekStart = startOfWeek(currentDate);
    const todayIndex = Math.floor((currentDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
    setMobileStartIndex(Math.max(0, Math.min(todayIndex, 4))); // Keep in bounds for 3-day view
  }, [currentDate]);

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  const events = useQuery(api.events.list, {
    startDate: weekStart.getTime(),
    endDate: weekEnd.getTime(),
  });

  const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // On mobile show 3 days, on desktop show all 7
  const visibleDays = isMobile
    ? allDays.slice(mobileStartIndex, mobileStartIndex + 3)
    : allDays;

  const canGoBack = mobileStartIndex > 0;
  const canGoForward = mobileStartIndex < 4; // 7 - 3 = 4

  // Get all timed events for a specific day
  const getEventsForDay = (day: Date) => {
    if (!events) return [];
    return events.filter((event) => {
      if (event.allDay) return false;
      const eventStart = new Date(event.startDate);
      return isSameDay(eventStart, day);
    });
  };

  const getAllDayEvents = (day: Date) => {
    if (!events) return [];
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      return event.allDay && isSameDay(eventStart, day);
    });
  };

  const formatEventTime = (timestamp: number) => {
    return format(new Date(timestamp), "h:mm a");
  };

  // Calculate event position and height
  const getEventStyle = (event: { startDate: number; endDate: number }) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const dayStart = startOfDay(start);

    const startMinutes = differenceInMinutes(start, dayStart);
    const durationMinutes = Math.max(differenceInMinutes(end, start), 30);

    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = (durationMinutes / 60) * HOUR_HEIGHT;

    return { top, height };
  };

  const handleSlotClick = (day: Date, hour: number) => {
    setSelectedDate(setHours(day, hour));
    setSelectedHour(hour);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: EventType, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent slot click
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const numCols = visibleDays.length;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Mobile navigation */}
        {isMobile && (
          <div className="flex items-center justify-between px-2 py-1 bg-pink-50 border-b border-pink-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileStartIndex(Math.max(0, mobileStartIndex - 1))}
              disabled={!canGoBack}
              className="p-1"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-pink-600">
              {format(visibleDays[0], "MMM d")} - {format(visibleDays[visibleDays.length - 1], "MMM d")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileStartIndex(Math.min(4, mobileStartIndex + 1))}
              disabled={!canGoForward}
              className="p-1"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Header with day names */}
        <div
          className="grid gap-px bg-pink-200 border-b border-pink-200"
          style={{ gridTemplateColumns: `3rem repeat(${numCols}, 1fr)` }}
        >
          <div className="bg-pink-50 p-1 md:p-2"></div>
          {visibleDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "bg-pink-50 p-1 md:p-2 text-center",
                isToday(day) && "bg-pink-100"
              )}
            >
              <div className="text-xs md:text-sm font-medium text-pink-600">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "text-base md:text-lg font-semibold",
                  isToday(day) && "text-pink-600"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* All-day events row */}
        <div
          className="grid gap-px bg-pink-200 border-b border-pink-200"
          style={{ gridTemplateColumns: `3rem repeat(${numCols}, 1fr)` }}
        >
          <div className="bg-pink-50 p-1 text-[10px] md:text-xs text-pink-400 text-right pr-1">
            All day
          </div>
          {visibleDays.map((day) => {
            const allDayEvts = getAllDayEvents(day);
            return (
              <div
                key={`allday-${day.toISOString()}`}
                className={cn(
                  "bg-card min-h-[1.5rem] md:min-h-[2rem] p-0.5",
                  isToday(day) && "bg-pink-50/50"
                )}
              >
                {allDayEvts.slice(0, 2).map((event) => (
                  <div
                    key={event._id}
                    className="text-[10px] md:text-xs p-0.5 mb-0.5 rounded truncate"
                    style={{ backgroundColor: event.color || "#ec4899", color: "white" }}
                  >
                    {event.title}
                  </div>
                ))}
                {allDayEvts.length > 2 && (
                  <div className="text-[10px] text-pink-500">+{allDayEvts.length - 2}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex">
            {/* Time labels column */}
            <div className="w-12 md:w-16 flex-shrink-0">
              {HOURS.map((hour) => (
                <div
                  key={`hour-${hour}`}
                  className="text-[10px] md:text-xs text-pink-500 text-right pr-1 md:pr-2 font-medium"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {format(setHours(new Date(), hour), "h a")}
                </div>
              ))}
            </div>

            {/* Days columns with events */}
            <div
              className="flex-1 grid"
              style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}
            >
              {visibleDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "relative border-l border-pink-200",
                      isToday(day) && "bg-pink-50/30"
                    )}
                  >
                    {/* Hour lines */}
                    {HOURS.map((hour) => (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        onClick={() => handleSlotClick(day, hour)}
                        className="border-t-2 border-pink-300/70 cursor-pointer hover:bg-pink-100/50 transition-colors"
                        style={{ height: HOUR_HEIGHT }}
                      />
                    ))}

                    {/* Events overlay */}
                    {dayEvents.map((event) => {
                      const { top, height } = getEventStyle(event);
                      const isShort = height < 50;
                      return (
                        <div
                          key={event._id}
                          onClick={(e) => handleEventClick(event as EventType, e)}
                          className="absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-md overflow-hidden text-white cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all shadow-md border-l-4"
                          style={{
                            top,
                            height: Math.max(height, 22),
                            backgroundColor: event.color || "#ec4899",
                            borderLeftColor: "rgba(0,0,0,0.2)",
                            zIndex: 10,
                            padding: isShort ? "2px 4px" : "4px",
                          }}
                        >
                          {isShort ? (
                            <div className="text-[10px] md:text-[11px] font-medium truncate leading-tight">
                              {event.title}
                            </div>
                          ) : (
                            <>
                              <div className="text-[10px] md:text-xs font-semibold truncate leading-tight">{event.title}</div>
                              <div className="text-[9px] md:text-[10px] opacity-90 mt-0.5 hidden md:block">
                                {formatEventTime(event.startDate)} - {formatEventTime(event.endDate)}
                              </div>
                              <div className="text-[9px] opacity-90 md:hidden">
                                {format(new Date(event.startDate), "h:mm")}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        defaultHour={selectedHour ?? undefined}
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
