import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar, CheckSquare, Clock } from "lucide-react";

export default function Landing() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Planner</span>
          </div>
          <Button onClick={() => signIn()}>Sign In</Button>
        </div>
      </header>

      {/* Hero section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Plan your day,
            <br />
            <span className="text-primary">achieve your goals</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            A simple and beautiful planner to help you stay organized. Manage your calendar events
            and daily to-dos in one place.
          </p>
          <div className="mt-10">
            <Button size="lg" onClick={() => signIn()}>
              Get Started
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Calendar Views</h3>
            <p className="text-sm text-muted-foreground">
              Switch between month and week views to see your schedule at a glance.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <CheckSquare className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Daily To-Dos</h3>
            <p className="text-sm text-muted-foreground">
              Keep track of your tasks with a simple and intuitive to-do list.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Real-time Sync</h3>
            <p className="text-sm text-muted-foreground">
              Your data syncs instantly across all your devices.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
