import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@healthymama/convex";
import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react-native";

export default function TodosScreen() {
  const todos = useQuery(api.todos.list);
  const createTodo = useMutation(api.todos.create);
  const toggleTodo = useMutation(api.todos.toggle);
  const removeTodo = useMutation(api.todos.remove);

  const [newTodo, setNewTodo] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const incompleteTodos = todos?.filter((t) => !t.completed) ?? [];
  const completedTodos = todos?.filter((t) => t.completed) ?? [];

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;

    setIsAdding(true);
    try {
      await createTodo({ title: newTodo.trim() });
      setNewTodo("");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (id: string) => {
    await toggleTodo({ id: id as any });
  };

  const handleRemove = async (id: string) => {
    await removeTodo({ id: id as any });
  };

  const renderTodoItem = ({
    item,
  }: {
    item: (typeof todos extends (infer T)[] | undefined ? T : never);
  }) => (
    <View style={styles.todoItem}>
      <Pressable
        onPress={() => handleToggle(item._id)}
        style={[
          styles.checkbox,
          item.completed && styles.checkboxCompleted,
        ]}
      >
        {item.completed && <Check size={14} color="white" />}
      </Pressable>

      <Text
        style={[styles.todoText, item.completed && styles.todoTextCompleted]}
      >
        {item.title}
      </Text>

      <Pressable
        onPress={() => handleRemove(item._id)}
        style={styles.deleteButton}
      >
        <Trash2 size={18} color="#ef4444" />
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Add Todo Input */}
        <View style={styles.inputRow}>
          <TextInput
            value={newTodo}
            onChangeText={setNewTodo}
            placeholder="Add a new task..."
            placeholderTextColor="#9ca3af"
            style={styles.input}
            onSubmitEditing={handleAddTodo}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleAddTodo}
            disabled={isAdding || !newTodo.trim()}
            style={[
              styles.addButton,
              (isAdding || !newTodo.trim()) && styles.addButtonDisabled,
            ]}
          >
            <Plus size={24} color="white" />
          </Pressable>
        </View>

        {/* Todo List */}
        {todos === undefined ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : todos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>Add a task to get started</Text>
          </View>
        ) : (
          <FlatList
            data={[...incompleteTodos, ...completedTodos]}
            keyExtractor={(item) => item._id}
            renderItem={renderTodoItem}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              incompleteTodos.length > 0 ? (
                <Text style={styles.sectionHeader}>
                  {incompleteTodos.length} task
                  {incompleteTodos.length !== 1 ? "s" : ""} remaining
                </Text>
              ) : null
            }
            ListFooterComponent={
              completedTodos.length > 0 ? (
                <View style={styles.completedSection}>
                  <Text style={styles.completedHeader}>
                    Completed ({completedTodos.length})
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    color: "#1f2937",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#ec4899",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#f9a8d4",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#9ca3af",
  },
  emptyTitle: {
    color: "#9ca3af",
    fontSize: 18,
  },
  emptySubtitle: {
    color: "#9ca3af",
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 8,
    marginLeft: 4,
  },
  completedSection: {
    marginTop: 16,
  },
  completedHeader: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
    marginBottom: 8,
    marginLeft: 4,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f9a8d4",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: "#ec4899",
    borderColor: "#ec4899",
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  todoTextCompleted: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
  },
});
