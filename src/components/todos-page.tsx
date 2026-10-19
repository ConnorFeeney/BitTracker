"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  Circle,
  Clock3,
  ListTodo,
  LoaderCircle,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { AppHeader, BitMark } from "@/components/app-header";
import { ItemActions } from "@/components/item-actions";
import { AnimatedHeight } from "@/components/animated-height";
import { TodoForm } from "@/components/todo-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dateKey, parseDate } from "@/lib/dates";
import { todoRepository, type Todo, type TodoInput } from "@/lib/todos";

type Filter = "all" | "overdue" | "today" | "upcoming";
const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Could not save your changes. Please try again.";
export function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [today, setToday] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState<{ todo: Todo | null } | null>(null);
  const [deleting, setDeleting] = useState<Todo | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const busy = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const load = useCallback(
    () =>
      todoRepository
        .list()
        .then((items) => {
          setTodos(items);
          setLoadFailed(false);
          setError("");
        })
        .catch((error: unknown) => {
          setError(errorMessage(error));
          setLoadFailed(true);
        })
        .finally(() => {
          setToday(dateKey(new Date()));
          setLoading(false);
        }),
    [],
  );
  useEffect(() => {
    void load();
    const timer = setInterval(() => setToday(dateKey(new Date())), 30000);
    const focus = () => {
      if (!busy.current) void load();
    };
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("focus", focus);
    window.addEventListener("keydown", shortcut);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      window.removeEventListener("keydown", shortcut);
    };
  }, [load]);

  async function save(input: TodoInput, id?: string) {
    if (busy.current)
      throw new Error("Please wait for the current change to finish.");
    busy.current = true;
    try {
      const saved = id
        ? await todoRepository.update(id, input)
        : await todoRepository.create(input);
      setTodos((all) =>
        id
          ? all.map((item) => (item.id === id ? saved : item))
          : [...all, saved],
      );
    } finally {
      busy.current = false;
    }
  }
  async function remove(todo: Todo, complete: boolean) {
    if (busy.current) return;
    busy.current = true;
    setPending(todo.id);
    setError("");
    try {
      await todoRepository.remove(todo.id);
      if (complete) {
        setCompleting(todo.id);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          await new Promise((resolve) => setTimeout(resolve, 700));
      }
      setTodos((all) => all.filter((item) => item.id !== todo.id));
      setDeleting(null);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setCompleting(null);
      setPending(null);
      busy.current = false;
    }
  }
  const active = todos.filter((todo) => todo.id !== completing);
  const overdue = active.filter(
    (todo) => todo.dueDate && todo.dueDate < today,
  ).length;
  const dueToday = active.filter((todo) => todo.dueDate === today).length;
  const upcoming = active.filter(
    (todo) => todo.dueDate && todo.dueDate > today,
  ).length;
  const tags = [
    ...new Map(
      active
        .flatMap((todo) => todo.tags)
        .map((tag) => [tag.toLowerCase(), tag]),
    ).values(),
  ].sort((a, b) => a.localeCompare(b));
  const suggestions = [
    ...new Map(
      active
        .filter((todo) => todo.id !== form?.todo?.id)
        .flatMap((todo) => todo.tags)
        .map((tag) => [tag.toLowerCase(), tag]),
    ).values(),
  ].sort((a, b) => a.localeCompare(b));
  const term = query.trim().toLowerCase();
  const visible = todos
    .filter((todo) => {
      const matchesSearch =
        !term ||
        (term.startsWith("#")
          ? todo.tags.some((tag) => tag.toLowerCase().includes(term.slice(1)))
          : [todo.title, ...todo.tags].some((value) =>
              value.toLowerCase().includes(term),
            ));
      return (
        matchesSearch &&
        (!selectedTag ||
          todo.tags.some(
            (tag) => tag.toLowerCase() === selectedTag.toLowerCase(),
          )) &&
        (filter === "all" ||
          (filter === "overdue" && !!todo.dueDate && todo.dueDate < today) ||
          (filter === "today" && todo.dueDate === today) ||
          (filter === "upcoming" && !!todo.dueDate && todo.dueDate > today))
      );
    })
    .sort(
      (a, b) =>
        (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
        a.createdAt.localeCompare(b.createdAt),
    );
  const sections = [
    {
      label: "Overdue",
      key: "overdue",
      items: visible.filter((todo) => todo.dueDate && todo.dueDate < today),
    },
    {
      label: "Today",
      key: "today",
      items: visible.filter((todo) => todo.dueDate === today),
    },
    ...[
      ...new Set(
        visible
          .filter((todo) => todo.dueDate && todo.dueDate > today)
          .map((todo) => todo.dueDate!),
      ),
    ].map((day) => ({
      label: parseDate(day).toLocaleDateString("en", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      key: day,
      items: visible.filter((todo) => todo.dueDate === day),
    })),
    {
      label: "No date",
      key: "undated",
      items: visible.filter((todo) => !todo.dueDate),
    },
  ].filter((section) => section.items.length);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-primary p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <AppHeader active="todos" />
      <main
        id="main"
        className="page-enter mx-auto max-w-250 px-5 pb-10 pt-9 md:px-10 md:pt-11"
      >
        <div className="mb-7 flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-3 text-[28px] font-semibold tracking-tight">
            To-dos{" "}
            <Badge
              variant="secondary"
              className="rounded-full font-mono text-xs"
            >
              {active.length}
            </Badge>
          </h1>
          <Button
            size="lg"
            disabled={loading || loadFailed || !!pending}
            onClick={() => setForm({ todo: null })}
          >
            <Plus />
            Add to-do
          </Button>
        </div>
        <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span
            className={
              overdue
                ? "flex items-center gap-1.5 text-destructive"
                : "flex items-center gap-1.5"
            }
          >
            <Clock3 className="size-3.5" />
            {overdue} overdue
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {dueToday} today
          </span>
          <span>{upcoming} upcoming</span>
        </div>
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <span>{error}</span>
            {loadFailed ? (
              <Button
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  void load();
                }}
              >
                Try again
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X />
              </Button>
            )}
          </div>
        )}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter to-dos"
            className="flex rounded-md border border-border bg-card p-0.5"
          >
            {(
              [
                ["all", "All"],
                ["today", "Today"],
                ["upcoming", "Upcoming"],
                ["overdue", "Overdue"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${filter === key ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative min-w-44 flex-1 sm:max-w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              ref={searchRef}
              aria-label="Search to-dos"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks or #tag"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>
        {tags.length > 0 && (
          <div
            aria-label="Filter by tag"
            className="mb-6 flex flex-wrap items-center gap-2"
          >
            <Tag className="mr-1 size-3.5 text-muted-foreground" />
            {tags.map((tag) => (
              <button
                key={tag.toLowerCase()}
                aria-pressed={selectedTag?.toLowerCase() === tag.toLowerCase()}
                onClick={() =>
                  setSelectedTag(
                    selectedTag?.toLowerCase() === tag.toLowerCase()
                      ? null
                      : tag,
                  )
                }
                className={`max-w-full truncate rounded-full border px-2.5 py-1 text-[11px] transition-colors ${selectedTag?.toLowerCase() === tag.toLowerCase() ? "border-blue-400/40 bg-blue-400/10 text-blue-300" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                # {tag}
              </button>
            ))}
            {selectedTag && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelectedTag(null)}
              >
                <X />
                Clear tag
              </Button>
            )}
          </div>
        )}
        <AnimatedHeight>
          {loading ? (
            <div
              role="status"
              className="flex justify-center gap-2 py-16 text-sm text-muted-foreground"
            >
              <LoaderCircle className="size-4 animate-spin" />
              Loading to-dos…
            </div>
          ) : loadFailed ? null : !sections.length ? (
            <div
              role="status"
              className="todo-empty rounded-lg border border-dashed border-border py-14 text-center"
            >
              <ListTodo className="mx-auto mb-3 size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {todos.length ? "No matching to-dos." : "No to-dos."}
              </p>
              {query || selectedTag || filter !== "all" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setQuery("");
                    setSelectedTag(null);
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setForm({ todo: null })}
                >
                  <Plus />
                  Add to-do
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-7">
              {sections.map((section) => (
                <section key={section.key} aria-label={section.label}>
                  <h2
                    className={`mb-3 flex items-center gap-2 text-xs font-semibold ${section.key === "overdue" ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {section.label}
                    <span className="font-mono text-[10px] font-normal">
                      {section.items.length}
                    </span>
                  </h2>
                  <ul className="overflow-hidden rounded-lg border border-border">
                    {section.items.map((todo) => (
                      <li
                        key={todo.id}
                        data-todo-id={todo.id}
                        className={`todo-row border-b border-border last:border-b-0 ${completing === todo.id ? `todo-completing ${visible.length === 1 ? "todo-completing-last" : ""}` : ""}`}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <ItemActions
                            label={todo.title}
                            onEdit={() => setForm({ todo })}
                            onDelete={() => setDeleting(todo)}
                            disabled={!!pending}
                          >
                            <div className="flex items-start gap-3 p-4">
                              <button
                                type="button"
                                disabled={!!pending}
                                aria-label={`Complete ${todo.title}`}
                                onClick={() => void remove(todo, true)}
                                className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-green-400 focus-visible:text-green-400"
                              >
                                {completing === todo.id ? (
                                  <Check className="size-5 text-green-400" />
                                ) : pending === todo.id ? (
                                  <LoaderCircle className="size-5 animate-spin" />
                                ) : (
                                  <Circle className="size-5" />
                                )}
                              </button>
                              <div className="min-w-0 text-sm leading-5">
                                <span className="todo-title relative block w-fit max-w-full wrap-break-word">
                                  {todo.title}
                                </span>
                                {(todo.dueDate || todo.tags.length > 0) && (
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {todo.dueDate && (
                                      <span
                                        className={`flex items-center gap-1 text-[11px] ${todo.dueDate < today ? "text-destructive" : "text-muted-foreground"}`}
                                      >
                                        <CalendarDays className="size-3" />
                                        {parseDate(
                                          todo.dueDate,
                                        ).toLocaleDateString("en", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </span>
                                    )}
                                    {todo.tags.map((tag) => (
                                      <button
                                        key={tag.toLowerCase()}
                                        onClick={() => setSelectedTag(tag)}
                                        className="max-w-full truncate rounded border border-blue-400/15 bg-blue-400/5 px-1.5 py-0.5 text-[10px] text-blue-300 hover:bg-blue-400/10"
                                      >
                                        # {tag}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </ItemActions>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </AnimatedHeight>
        <footer className="mt-12 flex flex-wrap items-center gap-2 border-t border-border pt-5 text-[11px] text-muted-foreground">
          <BitMark small />
          bittracker<span className="text-[#484f58]">·</span>
          <span>Saved in this browser. No accounts, no uploads.</span>
        </footer>
      </main>
      {form && (
        <TodoForm
          todo={form.todo}
          suggestions={suggestions}
          onClose={() => setForm(null)}
          onSave={save}
        />
      )}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !pending) setDeleting(null);
        }}
      >
        <DialogContent className="border border-border p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.title}”?</DialogTitle>
            <DialogDescription>
              This permanently removes this to-do.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={!!pending}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!!pending}
              onClick={() => {
                if (deleting) void remove(deleting, false);
              }}
            >
              <Trash2 />
              Delete to-do
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
