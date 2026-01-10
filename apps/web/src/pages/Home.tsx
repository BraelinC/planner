import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Calendar from "@/components/calendar/Calendar";
import TodoPanel from "@/components/todos/TodoPanel";
import AiInput from "@/components/AiInput";
import GoogleCalendarSync from "@/components/GoogleCalendarSync";
import ClaudeDashboard from "@/components/dashboard/ClaudeDashboard";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar as CalendarIcon, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "calendar" | "claude";

export default function Home() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-pink-200 bg-gradient-to-r from-pink-50 to-white">
        <div className="container mx-auto px-2 md:px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 md:gap-2">
              <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h1 className="text-lg md:text-xl font-bold">Planner</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center bg-pink-100/50 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("calendar")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === "calendar"
                    ? "bg-white text-primary shadow-sm"
                    : "text-pink-600 hover:bg-white/50"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button
                onClick={() => setActiveTab("claude")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === "claude"
                    ? "bg-slate-900 text-cyan-400 shadow-sm"
                    : "text-pink-600 hover:bg-white/50"
                )}
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Claude</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {activeTab === "calendar" && <GoogleCalendarSync />}
            {user && (
              <div className="flex items-center gap-2">
                {user.profileImageUrl && (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name || "User"}
                    className="h-7 w-7 md:h-8 md:w-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium hidden md:inline">
                  {user.name || user.email}
                </span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out" className="h-8 w-8 md:h-10 md:w-10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      {activeTab === "calendar" ? (
        <main className="container mx-auto px-2 md:px-4 py-3 md:py-6">
          <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 md:gap-6">
            {/* Calendar - takes up 3/4 on large screens */}
            <div className="lg:col-span-3 h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
              <Calendar />
            </div>

            {/* Todo panel - takes up 1/4 on large screens, collapsible on mobile */}
            <div className="lg:col-span-1 h-64 md:h-auto overflow-hidden">
              <TodoPanel />
            </div>
          </div>

          {/* Floating AI Input - bottom right on desktop, bottom center on mobile */}
          <div className="fixed bottom-3 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-96 z-50">
            <div className="bg-white rounded-xl shadow-2xl border-2 border-pink-200 p-3 md:p-4">
              <AiInput />
            </div>
          </div>
        </main>
      ) : (
        <main className="h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
          <ClaudeDashboard />
        </main>
      )}
    </div>
  );
}
