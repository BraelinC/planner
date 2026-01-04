import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@healthymama/convex";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  Send,
  Calendar,
  CheckSquare,
  List,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ToolResult {
  toolName: string;
  result: any;
}

export default function AiInput() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastToolResults, setLastToolResults] = useState<ToolResult[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatAgent = useAction(api.agent.chat);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsExpanded(true);

    // Add user message to chat
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    setLastToolResults([]);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await chatAgent({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        timezone,
      });

      // Add assistant response
      setMessages([...newMessages, { role: "assistant", content: result.text }]);
      setLastToolResults(result.toolResults || []);
    } catch (error) {
      console.error("Agent error:", error);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again!" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "createEvent":
      case "listUpcomingEvents":
        return <Calendar className="h-3 w-3" />;
      case "createTodo":
      case "completeTodo":
        return <CheckSquare className="h-3 w-3" />;
      case "listTodos":
        return <List className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  const formatToolResult = (tr: ToolResult) => {
    const result = tr.result;
    if (result?.message) return result.message;
    if (result?.success) return "Done!";
    return JSON.stringify(result);
  };

  const clearChat = () => {
    setMessages([]);
    setLastToolResults([]);
    setIsExpanded(false);
  };

  return (
    <div className="w-full">
      {/* Expandable chat history */}
      {messages.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 mb-1"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            {isExpanded ? "Hide" : "Show"} chat ({messages.length} messages)
          </button>

          {isExpanded && (
            <div className="max-h-48 overflow-y-auto space-y-2 mb-2 p-2 bg-pink-50/50 rounded-lg border border-pink-100">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-sm p-2 rounded-lg",
                    msg.role === "user"
                      ? "bg-pink-100 text-pink-900 ml-4"
                      : "bg-white text-gray-700 mr-4 border border-pink-100"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Tool results badges */}
          {lastToolResults.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {lastToolResults.map((tr, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                >
                  {getToolIcon(tr.toolName)}
                  <span>{formatToolResult(tr)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Clear button */}
          <button
            onClick={clearChat}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear chat
          </button>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try: 'Meeting tomorrow at 3pm' or 'Show my tasks'"
            className="pl-10 border-pink-200 focus:border-pink-400"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-pink-500 hover:bg-pink-600"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Quick suggestions when empty */}
      {messages.length === 0 && !isLoading && (
        <div className="mt-2 flex flex-wrap gap-1">
          {["What's on my calendar?", "Add task: ", "Schedule meeting "].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="text-xs px-2 py-1 bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
