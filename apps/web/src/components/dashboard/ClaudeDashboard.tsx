import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Check,
  X,
  RefreshCw,
  Terminal,
  Bot,
  ListTodo,
} from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "completed";
type Priority = "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  category?: string;
  createdBy?: string;
  createdAt: number;
}

interface Instance {
  id: string;
  name: string;
  status: "active" | "idle" | "offline";
  ramUsage?: number;
  lastHeartbeat: number;
}

export default function ClaudeDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newCategory, setNewCategory] = useState("");
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<{ message: string; type: string }[]>([
    { message: "Dashboard initialized", type: "info" },
  ]);
  const [instanceName, setInstanceName] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("claude-tasks");
    const savedInstances = localStorage.getItem("claude-instances");
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedInstances) setInstances(JSON.parse(savedInstances));
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("claude-tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("claude-instances", JSON.stringify(instances));
  }, [instances]);

  const log = (message: string, type = "out") => {
    setLogs((prev) => [
      ...prev.slice(-50),
      { message: `[${new Date().toLocaleTimeString()}] ${message}`, type },
    ]);
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.trim(),
      status: "pending",
      priority: newPriority,
      category: newCategory || undefined,
      createdAt: Date.now(),
    };
    setTasks((prev) => [task, ...prev]);
    setNewTask("");
    setNewCategory("");
    log(`Task added: ${task.title}`, "out");
  };

  const setTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    log(`Task status updated to ${status}`, "out");
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    log("Task deleted", "out");
  };

  const registerInstance = () => {
    if (!instanceName.trim()) return;
    const instance: Instance = {
      id: Date.now().toString(),
      name: instanceName.trim(),
      status: "active",
      lastHeartbeat: Date.now(),
    };
    setInstances((prev) => [...prev, instance]);
    setInstanceName("");
    log(`Instance registered: ${instance.name}`, "out");
  };

  const runCommand = () => {
    if (!command.trim()) return;
    log(`> ${command}`, "cmd");

    if (command.startsWith("click")) {
      log(`Click executed at ${command.split(" ")[1]}`, "out");
    } else if (command.startsWith("type")) {
      log("Text typed", "out");
    } else if (command === "screenshot") {
      log("Screenshot captured", "out");
    } else if (command.startsWith("scroll")) {
      log(`Scrolled ${command.split(" ")[1]}px`, "out");
    } else if (command.startsWith("press")) {
      log(`Key pressed: ${command.split(" ")[1]}`, "out");
    } else {
      log("Command queued", "out");
    }
    setCommand("");
  };

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const priorityColors = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const statusColors = {
    pending: "border-l-yellow-500",
    in_progress: "border-l-blue-500",
    completed: "border-l-green-500",
  };

  return (
    <div className="h-full flex gap-4">
      {/* Sidebar */}
      <div className="w-72 flex flex-col gap-4 shrink-0">
        {/* Instances */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-4 py-3 bg-cyan-500/10 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <Bot className="h-4 w-4" />
              Active Instances
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-cyan-400"
              onClick={() => log("Instances refreshed", "info")}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <div className="p-3 space-y-2">
            {instances.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                No instances registered
              </p>
            ) : (
              instances.map((inst) => (
                <div
                  key={inst.id}
                  className={cn(
                    "bg-slate-800/50 rounded-lg p-3 border-l-2",
                    inst.status === "active"
                      ? "border-l-green-500"
                      : inst.status === "idle"
                      ? "border-l-yellow-500"
                      : "border-l-slate-500 opacity-60"
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-white">{inst.name}</span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        inst.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : inst.status === "idle"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-slate-500/20 text-slate-400"
                      )}
                    >
                      {inst.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Last seen: {new Date(inst.lastHeartbeat).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="Instance name"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500"
                onKeyPress={(e) => e.key === "Enter" && registerInstance()}
              />
              <Button
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-600"
                onClick={registerInstance}
              >
                Register
              </Button>
            </div>
          </div>
        </div>

        {/* Command Log */}
        <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-cyan-500/10 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <Terminal className="h-4 w-4" />
              Output Log
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-cyan-400"
              onClick={() => setLogs([{ message: "Log cleared", type: "info" }])}
            >
              Clear
            </Button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1 bg-slate-950/50">
            {logs.map((log, i) => (
              <div
                key={i}
                className={cn(
                  log.type === "cmd"
                    ? "text-cyan-400"
                    : log.type === "err"
                    ? "text-red-400"
                    : log.type === "info"
                    ? "text-blue-400"
                    : "text-green-400"
                )}
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Command Center */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-4 py-3 bg-cyan-500/10 border-b border-slate-700/50">
            <span className="text-cyan-400 font-semibold">Command Center</span>
          </div>
          <div className="p-4">
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command (click 500,300 | type 'text' | screenshot)"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-500"
                onKeyPress={(e) => e.key === "Enter" && runCommand()}
              />
              <Button className="bg-cyan-500 hover:bg-cyan-600" onClick={runCommand}>
                Run
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["screenshot", "click 640,360", "scroll 300", "press Enter", "press Tab"].map(
                (cmd) => (
                  <Button
                    key={cmd}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => {
                      setCommand(cmd);
                      setTimeout(runCommand, 0);
                    }}
                  >
                    {cmd.split(" ")[0]}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-cyan-500/10 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <ListTodo className="h-4 w-4" />
              Claude Tasks
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-cyan-400"
              onClick={() => log("Tasks refreshed", "info")}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Task title..."
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500"
                onKeyPress={(e) => e.key === "Enter" && addTask()}
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category"
                className="w-28 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500"
              />
              <Button className="bg-green-500 hover:bg-green-600" onClick={addTask}>
                Add Task
              </Button>
            </div>
            <div className="flex gap-2">
              {(["all", "pending", "in_progress", "completed"] as const).map((f) => (
                <Button
                  key={f}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-slate-600",
                    filter === f
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                      : "text-slate-400 hover:bg-slate-700"
                  )}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredTasks.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No tasks</p>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "bg-slate-800/50 rounded-lg p-4 border-l-4",
                    statusColors[task.status],
                    task.status === "completed" && "opacity-60"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={cn(
                        "font-medium text-white",
                        task.status === "completed" && "line-through"
                      )}
                    >
                      {task.title}
                    </span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border",
                        priorityColors[task.priority]
                      )}
                    >
                      {task.priority}
                    </span>
                    {task.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {task.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    {task.status} | {new Date(task.createdAt).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 border-slate-600 text-slate-400"
                      onClick={() => setTaskStatus(task.id, "pending")}
                    >
                      <Pause className="h-3 w-3 mr-1" /> Pending
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 border-slate-600 text-slate-400"
                      onClick={() => setTaskStatus(task.id, "in_progress")}
                    >
                      <Play className="h-3 w-3 mr-1" /> Start
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 border-slate-600 text-slate-400"
                      onClick={() => setTaskStatus(task.id, "completed")}
                    >
                      <Check className="h-3 w-3 mr-1" /> Done
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 border-red-500/30 text-red-400 hover:bg-red-500/20"
                      onClick={() => deleteTask(task.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
