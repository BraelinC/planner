import { useMutation } from "convex/react";
import { api } from "@healthymama/convex";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doc } from "@healthymama/convex/dataModel";

interface TodoItemProps {
  todo: Doc<"todos">;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const toggleTodo = useMutation(api.todos.toggle);
  const removeTodo = useMutation(api.todos.remove);

  return (
    <div className="flex items-center gap-3 group p-2 rounded-md hover:bg-muted/50 transition-colors">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => toggleTodo({ id: todo._id })}
      />
      <span
        className={cn(
          "flex-1 text-sm",
          todo.completed && "line-through text-muted-foreground"
        )}
      >
        {todo.title}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => removeTodo({ id: todo._id })}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
