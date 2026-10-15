
import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  Plus,
  LogOut,
  Trash2,
  CheckSquare,
  Circle,
  Clock3,
  CheckCircle2,
  GripVertical,
  X,
  LoaderCircle,
  Pencil,
} from "lucide-react";
import { api } from "./lib/api";
import { todoFormSchema } from "./schemas";
import type { Todo, TodoStatus, User } from "./types";

interface BoardProps {
  user: User;
  onLogout: () => void;
}

const columns: {
  id: TodoStatus;
  title: string;
  icon: typeof Circle;
  color: string;
}[] = [
  { id: "todo", title: "Todo", icon: Circle, color: "text-sky-400" },
  {
    id: "inprogress",
    title: "In Progress",
    icon: Clock3,
    color: "text-amber-400",
  },
  {
    id: "completed",
    title: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-400",
  },
];

function TaskCard({
  todo,
  onDelete,
  onEdit,
  overlay = false,
}: {
  todo: Todo;
  onDelete?: (id: string) => void;
  onEdit?: (todo: Todo) => void;
  overlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: todo._id,
    disabled: overlay,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group rounded-xl border border-white/[0.08] bg-[#18181b] p-4 transition ${
        isDragging ? "opacity-30" : "hover:border-white/20"
      } ${overlay ? "rotate-2 shadow-2xl" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Drag task"
          {...(overlay ? {} : listeners)}
          className="mt-0.5 shrink-0 cursor-grab text-zinc-600 hover:text-zinc-300 active:cursor-grabbing"
        >
          <GripVertical size={17} />
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-medium leading-5 text-zinc-100">
            {todo.title}
          </h3>

          {todo.description && (
            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-zinc-400">
              {todo.description}
            </p>
          )}

          <p className="mt-4 text-[11px] text-zinc-600">
            {new Date(todo.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {!overlay && (onEdit || onDelete) && (
          <div className="flex shrink-0 items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(todo);
                }}
                aria-label="Edit task"
                title="Edit task"
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-indigo-500/10 hover:text-indigo-400"
              >
                <Pencil size={15} />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(todo._id);
                }}
                aria-label="Delete task"
                title="Delete task"
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function Column({
  status,
  title,
  icon: Icon,
  color,
  todos,
  onDelete,
  onEdit,
}: {
  status: TodoStatus;
  title: string;
  icon: typeof Circle;
  color: string;
  todos: Todo[];
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={17} className={color} />

          <h2 className="text-sm font-semibold text-zinc-200">
            {title}
          </h2>

          <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-400">
            {todos.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[280px] space-y-3 rounded-xl border p-2 transition sm:p-3 ${
          isOver
            ? "border-indigo-400/60 bg-indigo-500/[0.07]"
            : "border-white/[0.06] bg-white/[0.015]"
        }`}
      >
        {todos.map((todo) => (
          <TaskCard
            key={todo._id}
            todo={todo}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}

        {todos.length === 0 && (
          <div className="flex min-h-[230px] flex-col items-center justify-center gap-2 text-center">
            <Icon size={24} className="text-zinc-700" />
            <p className="text-xs text-zinc-600">Drop tasks here</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Board({ user, onLogout }: BoardProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  async function loadTodos() {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/todos");
      setTodos(data.todos);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Could not load tasks. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTodos();
  }, []);

  function resetForm() {
    setShowForm(false);
    setEditingTodo(null);
    setTitle("");
    setDescription("");
    setError("");
  }

  function startCreating() {
    setEditingTodo(null);
    setTitle("");
    setDescription("");
    setError("");
    setShowForm(true);
  }

  function startEditing(todo: Todo) {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description ?? "");
    setError("");
    setShowForm(true);
  }

  async function createTodo(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = todoFormSchema.safeParse({ title, description });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid task");
      return;
    }

    setSaving(true);

    try {
      const { data } = await api.post("/todos", {
        ...parsed.data,
        status: "todo",
      });

      setTodos((prev) => [data.todo, ...prev]);
      resetForm();
      setNotice("Task created");
      window.setTimeout(() => setNotice(""), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not create task");
    } finally {
      setSaving(false);
    }
  }

  async function updateTodo(e: React.FormEvent) {
    e.preventDefault();

    if (!editingTodo) return;

    setError("");

    const parsed = todoFormSchema.safeParse({ title, description });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid task");
      return;
    }

    setSaving(true);

    try {
      const { data } = await api.patch(
        `/todos/${editingTodo._id}`,
        parsed.data
      );

      setTodos((current) =>
        current.map((todo) =>
          todo._id === editingTodo._id ? data.todo : todo
        )
      );

      resetForm();
      setNotice("Task updated");
      window.setTimeout(() => setNotice(""), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not update task");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTodo(id: string) {
    const previous = todos;
    setTodos((current) => current.filter((todo) => todo._id !== id));
    setError("");

    try {
      await api.delete(`/todos/${id}`);
      setNotice("Task deleted");
      window.setTimeout(() => setNotice(""), 2500);
    } catch (err: any) {
      setTodos(previous);
      setError(err.response?.data?.message || "Could not delete task");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTodo(null);

    const { active, over } = event;
    if (!over) return;

    const todo = todos.find((item) => item._id === String(active.id));
    if (!todo) return;

    const targetTodo = todos.find((item) => item._id === String(over.id));

    const targetStatus = columns.some((column) => column.id === over.id)
      ? (over.id as TodoStatus)
      : targetTodo?.status;

    if (!targetStatus || targetStatus === todo.status) return;

    const previous = todos;

    setTodos((current) =>
      current.map((item) =>
        item._id === todo._id
          ? { ...item, status: targetStatus }
          : item
      )
    );

    setError("");

    try {
      await api.patch(`/todos/${todo._id}`, {
        status: targetStatus,
      });
    } catch (err: any) {
      setTodos(previous);
      setError(
        err.response?.data?.message ||
          "Could not update task status. Please try again."
      );
    }
  }

  async function logout() {
    setError("");

    try {
      await api.post("/auth/logout");
      onLogout();
    } catch (err: any) {
      setError(err.response?.data?.message || "Logout failed. Please try again.");
    }
  }

  const completedCount = todos.filter(
    (todo) => todo.status === "completed"
  ).length;

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500 p-2.5">
              <CheckSquare size={21} />
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Taskflow
              </h1>
              <p className="hidden text-xs text-zinc-500 sm:block">
                Personal workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-zinc-200">
                {user.name}
              </p>
              <p className="text-xs text-zinc-500">{user.email}</p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.06]"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 sm:py-10 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-indigo-400">YOUR WORKSPACE</p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Keep things moving.
            </h2>

            <p className="mt-3 text-sm text-zinc-400">
              Organize your tasks and make progress every day.
            </p>
          </div>

          <button
            type="button"
            onClick={startCreating}
            className="flex items-center justify-center gap-2 self-start rounded-xl bg-indigo-500 px-4 py-3 text-sm font-medium transition hover:bg-indigo-400 sm:self-auto"
          >
            <Plus size={18} />
            Create task
          </button>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#111114] p-4 sm:p-5">
            <p className="text-sm text-zinc-400">Total tasks</p>
            <p className="mt-2 text-2xl font-semibold">{todos.length}</p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#111114] p-4 sm:p-5">
            <p className="text-sm text-zinc-400">Completed</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {completedCount}
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-3 text-sm text-red-300"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {notice && (
          <p role="status" className="mb-5 text-sm text-emerald-400">
            {notice}
          </p>
        )}

        {showForm && (
          <section className="mb-8 rounded-2xl border border-indigo-400/20 bg-[#111114] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold">
                {editingTodo ? "Edit task" : "Create a new task"}
              </h3>

              <button
                type="button"
                onClick={resetForm}
                aria-label="Close form"
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={editingTodo ? updateTodo : createTodo}
              className="space-y-4"
            >
              <input
                autoFocus
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to get done?"
                className="w-full rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-sm outline-none focus:border-indigo-500"
              />

              <textarea
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)"
                className="w-full resize-y rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-sm outline-none focus:border-indigo-500"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300 hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium hover:bg-indigo-400 disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {editingTodo ? "Save changes" : "Add task"}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="flex min-h-60 items-center justify-center gap-3 text-sm text-zinc-400">
            <LoaderCircle size={20} className="animate-spin" />
            Loading your workspace...
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={(event) => {
              const todo = todos.find(
                (item) => item._id === String(event.active.id)
              );
              setActiveTodo(todo ?? null);
            }}
            onDragCancel={() => setActiveTodo(null)}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4 xl:gap-6">
              {columns.map((column) => (
                <Column
                  key={column.id}
                  status={column.id}
                  title={column.title}
                  icon={column.icon}
                  color={column.color}
                  todos={todos.filter(
                    (todo) => todo.status === column.id
                  )}
                  onDelete={deleteTodo}
                  onEdit={startEditing}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTodo ? (
                <TaskCard todo={activeTodo} overlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        <p className="mt-8 text-center text-xs text-zinc-600">
          Drag tasks between columns to update their status.
        </p>
      </div>
    </main>
  );
}
