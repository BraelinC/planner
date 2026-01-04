import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@healthymama/convex";
import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const events = useQuery(api.events.list, {
    startDate: calendarStart.getTime(),
    endDate: calendarEnd.getTime(),
  });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  const getEventsForDay = (day: Date) => {
    if (!events) return [];
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      return isSameDay(eventStart, day);
    });
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <Pressable
          onPress={() => setCurrentDate(subMonths(currentDate, 1))}
          style={styles.navButton}
        >
          <ChevronLeft size={24} color="#db2777" />
        </Pressable>
        <Text style={styles.monthTitle}>{format(currentDate, "MMMM yyyy")}</Text>
        <Pressable
          onPress={() => setCurrentDate(addMonths(currentDate, 1))}
          style={styles.navButton}
        >
          <ChevronRight size={24} color="#db2777" />
        </Pressable>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarCard}>
        {/* Week day headers */}
        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDay}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar days */}
        <View style={styles.daysGrid}>
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasEvents = dayEvents.length > 0;

            return (
              <Pressable
                key={index}
                onPress={() => setSelectedDate(day)}
                style={styles.dayCell}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && styles.dayCircleSelected,
                    isToday(day) && !isSelected && styles.dayCircleToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday(day) && !isSelected && styles.dayTextToday,
                      !isCurrentMonth && styles.dayTextOtherMonth,
                    ]}
                  >
                    {format(day, "d")}
                  </Text>
                </View>
                {hasEvents && !isSelected && (
                  <View style={styles.eventDots}>
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <View
                        key={i}
                        style={[
                          styles.eventDot,
                          { backgroundColor: event.color || "#ec4899" },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected Day Events */}
      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={styles.eventsSectionTitle}>
            {selectedDate
              ? format(selectedDate, "EEEE, MMMM d")
              : "Select a date"}
          </Text>
        </View>

        <ScrollView style={styles.eventsList}>
          {selectedDate && selectedDayEvents.length === 0 ? (
            <View style={styles.noEventsCard}>
              <Text style={styles.noEventsText}>No events on this day</Text>
            </View>
          ) : (
            selectedDayEvents.map((event) => (
              <View
                key={event._id}
                style={[
                  styles.eventCard,
                  { borderLeftColor: event.color || "#ec4899" },
                ]}
              >
                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.description && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}
                <Text style={styles.eventTime}>
                  {event.allDay
                    ? "All day"
                    : `${format(new Date(event.startDate), "h:mm a")} - ${format(
                        new Date(event.endDate),
                        "h:mm a"
                      )}`}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  calendarCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  weekHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#fce7f3",
  },
  weekDay: {
    flex: 1,
    paddingVertical: 8,
  },
  weekDayText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: "#db2777",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleSelected: {
    backgroundColor: "#ec4899",
  },
  dayCircleToday: {
    backgroundColor: "#fce7f3",
  },
  dayText: {
    fontSize: 14,
    color: "#1f2937",
  },
  dayTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  dayTextToday: {
    color: "#db2777",
    fontWeight: "600",
  },
  dayTextOtherMonth: {
    color: "#d1d5db",
  },
  eventDots: {
    position: "absolute",
    bottom: 4,
    flexDirection: "row",
    gap: 2,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventsSection: {
    flex: 1,
    marginTop: 16,
  },
  eventsSectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  noEventsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  noEventsText: {
    color: "#9ca3af",
  },
  eventCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  eventTitle: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 16,
  },
  eventDescription: {
    color: "#6b7280",
    marginTop: 4,
  },
  eventTime: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
  },
});
