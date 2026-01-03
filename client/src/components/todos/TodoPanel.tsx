import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import TodoItem from "./TodoItem";
import AddTodo from "./AddTodo";

export default function TodoPanel() {
  const todos = useQuery(api.todos.list);

  const incompleteTodos = todos?.filter((t) => !t.completed) ?? [];
  const completedTodos = todos?.filter((t) => t.completed) ?? [];

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-pink-200 shadow-sm">
      <div className="p-2 md:p-4 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-white">
        <h2 className="text-base md:text-lg font-semibold">To-Do List</h2>
        <p className="text-xs md:text-sm text-pink-500">
          {incompleteTodos.length} task{incompleteTodos.length !== 1 ? "s" : ""} remaining
        </p>
      </div>

      <div className="p-2 md:p-4 border-b">
        <AddTodo />
      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-4">
        {todos === undefined ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No tasks yet</p>
            <p className="text-sm">Add a task to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Incomplete todos */}
            {incompleteTodos.length > 0 && (
              <div className="space-y-2">
                {incompleteTodos.map((todo) => (
                  <TodoItem key={todo._id} todo={todo} />
                ))}
              </div>
            )}

            {/* Completed todos */}
            {completedTodos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground pt-2">Completed</h3>
                {completedTodos.map((todo) => (
                  <TodoItem key={todo._id} todo={todo} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
