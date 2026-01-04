import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useQuery, useAction } from "convex/react";
import { api } from "@healthymama/convex";
import { format, startOfDay, endOfDay } from "date-fns";
import { Calendar, CheckSquare, Send, Sparkles } from "lucide-react-native";
import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function HomeScreen() {
  const chat = useAction(api.agent.chat);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  const today = new Date();
  const todayEvents = useQuery(api.events.list, {
    startDate: startOfDay(today).getTime(),
    endDate: endOfDay(today).getTime(),
  });

  const todos = useQuery(api.todos.list);
  const incompleteTodos = todos?.filter((t) => !t.completed) ?? [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatScrollRef.current && messages.length > 0) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await chat({
        messages: newMessages,
        timezone,
      });

      setMessages([
        ...newMessages,
        { role: "assistant", content: result.text || "Done!" },
      ]);
    } catch (error: any) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Date Display */}
          <Text style={styles.dateText}>
            {format(today, "EEEE, MMMM d, yyyy")}
          </Text>

          {/* AI Assistant Card */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconContainer}>
                <Sparkles size={18} color="#8b5cf6" />
              </View>
              <Text style={styles.aiTitle}>AI Assistant</Text>
            </View>

            {messages.length === 0 && (
              <Text style={styles.aiSubtitle}>
                Try: "Schedule meeting tomorrow at 3pm" or "Add groceries to my list"
              </Text>
            )}

            {/* Chat Messages - Scrollable Container */}
            {(messages.length > 0 || isLoading) && (
              <View style={styles.chatContainer}>
                <ScrollView
                  ref={chatScrollRef}
                  style={styles.messagesScroll}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {messages.map((msg, index) => (
                    <View
                      key={index}
                      style={[
                        styles.messageBubble,
                        msg.role === "user" ? styles.userBubble : styles.assistantBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          msg.role === "user" ? styles.userText : styles.assistantText,
                        ]}
                      >
                        {msg.content}
                      </Text>
                    </View>
                  ))}
                  {isLoading && (
                    <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                      <ActivityIndicator size="small" color="#8b5cf6" />
                      <Text style={styles.loadingText}>Thinking...</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Input Row */}
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask me anything..."
                placeholderTextColor="#9ca3af"
                style={styles.aiInput}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                editable={!isLoading}
                multiline={false}
              />
              <Pressable
                onPress={handleSend}
                disabled={isLoading || !input.trim()}
                style={[
                  styles.sendButton,
                  (isLoading || !input.trim()) && styles.sendButtonDisabled,
                ]}
              >
                <Send size={18} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Today's Events */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Calendar size={18} color="#ec4899" />
              </View>
              <Text style={styles.cardTitle}>Today's Events</Text>
            </View>

            {todayEvents === undefined ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Loading...</Text>
              </View>
            ) : todayEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No events scheduled for today</Text>
              </View>
            ) : (
              <View>
                {todayEvents.slice(0, 5).map((event) => (
                  <View
                    key={event._id}
                    style={[
                      styles.eventItem,
                      {
                        backgroundColor: `${event.color || "#ec4899"}15`,
                        borderLeftColor: event.color || "#ec4899",
                      },
                    ]}
                  >
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {!event.allDay && (
                      <Text style={styles.eventTime}>
                        {format(new Date(event.startDate), "h:mm a")} -{" "}
                        {format(new Date(event.endDate), "h:mm a")}
                      </Text>
                    )}
                    {event.allDay && (
                      <Text style={styles.eventTime}>All day</Text>
                    )}
                  </View>
                ))}
                {todayEvents.length > 5 && (
                  <Text style={styles.moreText}>
                    +{todayEvents.length - 5} more events
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Pending Tasks */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <CheckSquare size={18} color="#ec4899" />
              </View>
              <Text style={styles.cardTitle}>Pending Tasks</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{incompleteTodos.length}</Text>
              </View>
            </View>

            {todos === undefined ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Loading...</Text>
              </View>
            ) : incompleteTodos.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>All tasks completed!</Text>
              </View>
            ) : (
              <View>
                {incompleteTodos.slice(0, 5).map((todo) => (
                  <View key={todo._id} style={styles.todoItem}>
                    <View style={styles.todoCheckbox} />
                    <Text style={styles.todoText}>{todo.title}</Text>
                  </View>
                ))}
                {incompleteTodos.length > 5 && (
                  <Text style={styles.moreText}>
                    +{incompleteTodos.length - 5} more tasks
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  // Date Text
  dateText: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 16,
  },
  // AI Card
  aiCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#ede9fe",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  aiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 10,
  },
  aiSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
    lineHeight: 18,
  },
  // Chat Container
  chatContainer: {
    maxHeight: 220,
    marginBottom: 12,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    overflow: "hidden",
  },
  messagesScroll: {
    maxHeight: 220,
  },
  messagesContent: {
    padding: 12,
    paddingBottom: 8,
  },
  messageBubble: {
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: "85%",
  },
  userBubble: {
    backgroundColor: "#8b5cf6",
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: "#ffffff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 13,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: "white",
  },
  assistantText: {
    color: "#374151",
  },
  // Input Row
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiInput: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 15,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ddd6fe",
  },
  // Cards
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fce7f3",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 10,
  },
  badge: {
    marginLeft: "auto",
    backgroundColor: "#fce7f3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#db2777",
    fontWeight: "600",
    fontSize: 13,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  eventItem: {
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  eventTitle: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 15,
  },
  eventTime: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  moreText: {
    fontSize: 14,
    color: "#ec4899",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    marginBottom: 8,
  },
  todoCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#f9a8d4",
    marginRight: 12,
  },
  todoText: {
    flex: 1,
    color: "#374151",
    fontSize: 15,
  },
});
