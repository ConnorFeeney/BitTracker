"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader, BitMark } from "@/components/app-header";
import {
  Activity,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  Circle,
  Flame,
  Leaf,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContributionGraph,
  completionCounts,
  GraphLegend,
} from "@/components/contribution-graph";
import { HabitForm } from "@/components/habit-form";
import {
  currentStreak,
  dateKey,
  longestStreak,
  moveDate,
  parseDate,
} from "@/lib/dates";
import {
  habitColors,
  habitRepository,
  trackedWeekdays,
  weekdayLabels,
  type Habit,
  type HabitInput,
} from "@/lib/habits";

type Filter = "all" | "remaining" | "completed";
export function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [today, setToday] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState<{ habit: Habit | null } | null>(null);
  const [deleting, setDeleting] = useState<Habit | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const busy = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const load = useCallback(
    () =>
      habitRepository
        .list()
        .then((items) => {
          setHabits(items);
          setLoadFailed(false);
          setError("");
        })
        .catch((error: unknown) => {
          setError(message(error));
          setLoadFailed(true);
        })
        .finally(() => {
          const now = new Date();
          setToday(dateKey(now));
          setYear((value) => value ?? now.getFullYear());
          setLoading(false);
        }),
    [],
  );
  useEffect(() => {
    const refreshDate = () => {
      const now = new Date();
      setToday(dateKey(now));
      setYear((value) => value ?? now.getFullYear());
    };
    void load();
    const timer = window.setInterval(refreshDate, 30000);
    const onFocus = () => {
      refreshDate();
      if (!busy.current) void load();
    };
    window.addEventListener("focus", onFocus);
    const shortcuts = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcuts);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("keydown", shortcuts);
    };
  }, [load]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function save(input: HabitInput, id?: string) {
    const habit = id
      ? await habitRepository.update(id, input)
      : await habitRepository.create(input);
    setHabits((all) =>
      id ? all.map((item) => (item.id === id ? habit : item)) : [...all, habit],
    );
    setNotice(id ? "Habit updated." : "Habit created.");
  }
  async function toggle(habit: Habit, day: string) {
    if (busy.current) return;
    busy.current = true;
    setPending(habit.id);
    setError("");
    try {
      const completed = !habit.completions.includes(day);
      const updated = await habitRepository.setCompletion(
        habit.id,
        day,
        completed,
      );
      setHabits((all) =>
        all.map((item) => (item.id === habit.id ? updated : item)),
      );
      setNotice(
        completed
          ? `${habit.name} checked in.`
          : `Check-in removed for ${habit.name}.`,
      );
    } catch (error) {
      setError(message(error));
    } finally {
      busy.current = false;
      setPending(null);
    }
  }
  async function remove() {
    if (!deleting || busy.current) return;
    busy.current = true;
    setPending(deleting.id);
    setError("");
    try {
      await habitRepository.remove(deleting.id);
      setHabits((all) => all.filter((habit) => habit.id !== deleting.id));
      setDeleting(null);
      setNotice("Habit deleted.");
    } catch (error) {
      setError(message(error));
    } finally {
      busy.current = false;
      setPending(null);
    }
  }
  const dueToday = habits.filter((habit) =>
    trackedWeekdays(habit.weekdays).includes(today ? parseDate(today).getDay() : -1),
  );
  const completed = dueToday.filter((habit) =>
    habit.completions.includes(today),
  ).length;
  const allDays = habits.flatMap((habit) => habit.completions);
  const counts = completionCounts(allDays);
  const scheduledCounts: Record<string, number> = {};
  if (year !== null) {
    let cursor = new Date(year, 0, 1, 12);
    while (cursor.getFullYear() === year && dateKey(cursor) <= today) {
      const day = dateKey(cursor);
      scheduledCounts[day] = habits.filter((habit) =>
        dateKey(new Date(habit.createdAt)) <= day &&
        trackedWeekdays(habit.weekdays).includes(cursor.getDay()),
      ).length;
      cursor = moveDate(cursor, 1);
    }
  }
  const yearDays = allDays.filter((day) => day.startsWith(String(year)));
  const bestStreak =
    habits.length && today
      ? Math.max(
          ...habits.map((habit) => currentStreak(habit.completions, today, habit.weekdays)),
        )
      : 0;
  const bestEver = Math.max(
    0,
    ...habits.map((habit) => longestStreak(habit.completions, habit.weekdays)),
  );
  const weekStart = today ? dateKey(moveDate(parseDate(today), -6)) : "";
  const weekTotal = allDays.filter(
    (day) => day >= weekStart && day <= today,
  ).length;
  const visible = habits.filter(
    (habit) =>
      (habit.name + " " + habit.description)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "completed"
          ? habit.completions.includes(today)
          : dueToday.includes(habit) && !habit.completions.includes(today))),
  );
  const currentYear = today ? Number(today.slice(0, 4)) : 0;
  const firstYear = Math.min(
    currentYear,
    ...habits.map((habit) => Number(habit.createdAt.slice(0, 4))),
    ...allDays.map((day) => Number(day.slice(0, 4))),
  );
  const years = currentYear
    ? Array.from(
        { length: currentYear - firstYear + 1 },
        (_, i) => currentYear - i,
      )
    : [];

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <AppHeader active="habits" />

      <main
        id="main"
        className="page-enter mx-auto max-w-7xl px-5 pb-10 pt-9 md:px-10 md:pt-11"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">
              Overview
            </h1>
          </div>
          <Button
            size="lg"
            onClick={() => setForm({ habit: null })}
            disabled={loading || loadFailed}
            className="border border-white/10 px-4 text-[13px]"
          >
            <Plus />
            New habit
          </Button>
        </div>
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
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
                size="icon"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X />
              </Button>
            )}
          </div>
        )}

        <section
          aria-label="Your habit statistics"
          className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          <Stat
            icon={<CheckCheck />}
            label="Completed today"
            value={`${completed}`}
            suffix={`/ ${dueToday.length}`}
            note={
              dueToday.length > 0 && completed === dueToday.length
                ? "All habits completed"
                : dueToday.length === 0 ? "No habits scheduled today" : "Scheduled check-ins"
            }
            green={completed > 0}
          />
          <Stat
            icon={<Flame />}
            label="Current streak"
            value={String(bestStreak)}
            suffix={bestStreak === 1 ? "day" : "days"}
            note="Your longest active habit streak"
          />
          <Stat
            icon={<Activity />}
            label="This week"
            value={String(weekTotal)}
            suffix="check-ins"
            note="A rolling 7 days of progress"
          />
          <Stat
            icon={<Trophy />}
            label="Longest streak"
            value={String(bestEver)}
            suffix={bestEver === 1 ? "day" : "days"}
            note="Personal best"
          />
        </section>

        <section aria-labelledby="activity-title" className="mb-9">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="activity-title" className="text-sm font-medium">
              Habit Graph
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                  />
                }
                aria-label="Select graph year"
              >
                {year ?? "…"}
                <ChevronDown className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {years.map((value) => (
                  <DropdownMenuItem key={value} onClick={() => setYear(value)}>
                    {value}
                    {year === value && <Check className="ml-auto size-3" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Card className="gap-0 overflow-hidden rounded-lg border-border bg-background py-0 shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-2 pt-5">
              <p className="text-[13px]">
                <span className="font-semibold">
                  {yearDays.length.toLocaleString()} contributions
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  in {year ?? "this year"}
                </span>
              </p>
            </div>
            <div className="px-4 py-3 md:px-5">
              {year && today ? (
                <ContributionGraph
                  counts={counts}
                  scheduledCounts={scheduledCounts}
                  year={year}
                  today={today}
                  label="All habit contributions"
                />
              ) : (
                <div className="h-32 animate-pulse rounded bg-muted/40" />
              )}
            </div>
            <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-1">
              <p className="text-[11px] text-muted-foreground">
                {new Set(yearDays).size} active days
              </p>
              <GraphLegend />
            </div>
          </Card>
        </section>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_260px]">
          <section
            id="habits"
            aria-labelledby="habits-title"
            className="min-w-0 scroll-mt-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="habits-title"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                Your habits
                <Badge
                  variant="secondary"
                  className="rounded-full font-mono text-[10px]"
                >
                  {habits.length}
                </Badge>
              </h2>
            </div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div
                className="flex rounded-md border border-border bg-card p-0.5"
                role="group"
                aria-label="Filter habits"
              >
                {(
                  [
                    ["all", "All habits"],
                    ["remaining", "To do"],
                    ["completed", "Done"],
                  ] as const
                ).map(([key, text]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    aria-pressed={filter === key}
                    className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${filter === key ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {text}
                  </button>
                ))}
              </div>
              <div className="relative min-w-36 flex-1 sm:max-w-56">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  aria-label="Find a habit"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find a habit…"
                  className="h-8 rounded-md bg-background pl-8 text-xs"
                />
              </div>
            </div>
            {loading ? (
              <div
                role="status"
                className="flex min-h-52 items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground"
              >
                <LoaderCircle className="size-4 animate-spin" />
                Loading your habits…
              </div>
            ) : loadFailed ? (
              <div className="rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">
                Your habits could not be loaded. Use “Try again” above to
                reconnect to browser storage.
              </div>
            ) : habits.length === 0 ? (
              <div className="empty-habits rounded-lg border border-dashed border-border px-5 py-10 text-center">
                <Button onClick={() => setForm({ habit: null })}>
                  <Plus />
                  Add habit
                </Button>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {["Read 20 minutes", "Move my body", "Practice a skill"].map(
                    (name) => (
                      <button
                        key={name}
                        className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-green-500/40 hover:text-foreground"
                        onClick={() =>
                          setForm({
                            habit: {
                              id: "",
                              name,
                              description: "",
                              color: "green",
                              weekdays: [],
                              createdAt: "",
                              completions: [],
                            },
                          })
                        }
                      >
                        + {name}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-10 text-center">
                <Search className="mx-auto mb-3 size-6 text-muted-foreground" />
                <h3 className="text-sm font-medium">No habits here yet.</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Try another search or filter.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Show all habits
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {visible.map((habit) => {
                  const done = habit.completions.includes(today),
                    due = trackedWeekdays(habit.weekdays).includes(parseDate(today).getDay()),
                    color = habitColors[habit.color],
                    streak = currentStreak(habit.completions, today, habit.weekdays);
                  return (
                    <Card
                      key={habit.id}
                      className="habit-card gap-0 overflow-hidden rounded-lg border-border bg-background py-0 shadow-none"
                    >
                      <div className="flex items-start gap-3 p-4 pb-2">
                        <span
                          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10"
                          style={{
                            background: `color-mix(in srgb, ${color} 9%, transparent)`,
                            color,
                          }}
                        >
                          <Leaf className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold">
                            {habit.name}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {habit.description || (trackedWeekdays(habit.weekdays).length === 7
                              ? "Every day"
                              : habit.weekdays.map((day) => weekdayLabels[day]).join(", "))}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" disabled={!!pending} />}
                            aria-label={`Actions for ${habit.name}`}
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setForm({ habit })}>
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleting(habit)}>
                              <Trash2 />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="px-3 pb-2 pt-3 md:px-4">
                        <ContributionGraph
                          counts={completionCounts(habit.completions)}
                          weekdays={habit.weekdays}
                          year={year!}
                          today={today}
                          color={color}
                          label={habit.name}
                          onSelect={(day) => void toggle(habit, day)}
                          disabled={!!pending}
                        />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card/50 px-4 py-3">
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Flame
                              className="size-3.5"
                              style={{
                                color: streak ? "#f2a65a" : undefined,
                              }}
                            />
                            <strong className="font-medium text-foreground">
                              {streak}
                            </strong>{" "}
                            day streak
                          </span>
                          <span>
                            {
                              habit.completions.filter((day) =>
                                day.startsWith(String(year)),
                              ).length
                            }{" "}
                            check-ins in {year}
                          </span>
                        </div>
                        <Button
                          variant={done ? "outline" : "default"}
                          size="sm"
                          disabled={!!pending || !due}
                          aria-pressed={done}
                          aria-label={due ? `${done ? "Undo" : "Complete"} ${habit.name} for today` : `${habit.name} is not scheduled today`}
                          onClick={() => void toggle(habit, today)}
                          className={
                            done
                              ? "border-green-500/25 bg-green-500/5 text-green-400 hover:bg-green-500/10"
                              : ""
                          }
                        >
                          {pending === habit.id ? (
                            <LoaderCircle className="animate-spin" />
                          ) : done ? (
                            <CheckCheck />
                          ) : (
                            <Check />
                          )}
                          {due ? (done ? "Completed today" : "Check in") : "Rest day"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-5 lg:pt-1">
            <Card className="gap-0 rounded-lg border-border bg-background py-0 shadow-none">
              <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                <h2 className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  Today’s focus
                </h2>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {today
                    ? parseDate(today).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      })
                    : "…"}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tracking-tight">
                    {completed}
                    <span className="text-base font-normal text-muted-foreground">
                      {" "}
                      / {dueToday.length}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    completed
                  </span>
                </div>
                <div className="mb-4 mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-[#39d353] transition-[width] duration-500"
                    style={{
                      width: `${dueToday.length ? (completed / dueToday.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                {dueToday.length ? (
                  <ul className="space-y-1">
                    {dueToday.map((habit) => (
                      <li key={habit.id}>
                        <button
                          onClick={() => void toggle(habit, today)}
                          disabled={!!pending || loading}
                          className="flex w-full items-center gap-2.5 rounded-md py-2 text-left text-xs hover:bg-secondary/50 disabled:opacity-50"
                          aria-label={`Toggle ${habit.name} for today`}
                          aria-pressed={habit.completions.includes(today)}
                        >
                          {habit.completions.includes(today) ? (
                            <CheckCheck className="size-4 shrink-0 text-green-400" />
                          ) : (
                            <Circle className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <span
                            className={`truncate ${habit.completions.includes(today) ? "text-muted-foreground line-through" : ""}`}
                          >
                            {habit.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs leading-5 text-muted-foreground">
                    No habits scheduled today.
                  </p>
                )}
              </div>
            </Card>
          </aside>
        </div>
        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <BitMark small />
            bittracker<span className="ml-1 text-[#484f58]">·</span>
            <span>Saved in this browser. No accounts, no uploads.</span>
          </span>
        </footer>
      </main>
      {notice && (
        <div
          key={notice}
          role="status"
          className="toast-enter fixed bottom-6 left-1/2 z-40 flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-green-500/30 bg-[#161b22] px-4 py-3 text-sm shadow-xl"
        >
          <Check className="size-4 shrink-0 text-green-400" />
          {notice}
        </div>
      )}
      {form && (
        <HabitForm
          habit={form.habit}
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
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
            <DialogDescription>
              This permanently removes this habit and all its check-ins from
              this browser. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex justify-end gap-2">
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
              onClick={() => void remove()}
            >
              {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
              Delete habit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function message(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
function Stat({
  icon,
  label,
  value,
  suffix,
  note,
  green,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix: string;
  note: string;
  green?: boolean;
}) {
  return (
    <Card className="gap-0 rounded-lg border-border bg-background px-4 py-4 shadow-none md:px-5">
      <div className="mb-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <span
          className={green ? "text-green-400 [&>svg]:size-4" : "[&>svg]:size-4"}
        >
          {icon}
        </span>
      </div>
      <div className="flex flex-wrap items-baseline gap-2">
        <span
          className={`text-[28px] font-semibold leading-none tracking-tight ${green ? "text-green-400" : ""}`}
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-muted-foreground md:text-[11px]">
        {note}
      </p>
    </Card>
  );
}
