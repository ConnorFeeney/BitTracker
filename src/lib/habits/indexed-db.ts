import { storageTransaction } from "@/lib/storage";
import { dateKey, isDateKey } from "@/lib/dates";
import {
  habitColors,
  type Habit,
  type HabitInput,
  type HabitRepository,
} from "./types";

function validate(input: HabitInput): HabitInput {
  const name = input.name.trim(),
    description = input.description.trim();
  if (!name || name.length > 80)
    throw new Error("Use a habit name between 1 and 80 characters.");
  if (description.length > 240)
    throw new Error("Keep the description under 240 characters.");
  if (!Object.hasOwn(habitColors, input.color))
    throw new Error("Choose a valid habit color.");
  return { name, description, color: input.color };
}
function changeHabit(
  id: string,
  change: (habit: Habit) => Habit,
): Promise<Habit> {
  return storageTransaction("habits", "readwrite", (store, result, fail) => {
    const request = store.get(id);
    request.onsuccess = () => {
      if (!request.result) {
        fail(
          new Error(
            "This habit no longer exists. Refresh to update your list.",
          ),
        );
        return;
      }
      const next = change(request.result as Habit);
      store.put(next);
      result(next);
    };
  });
}
export const indexedDbRepository: HabitRepository = {
  list: () =>
    storageTransaction("habits", "readonly", (store, result) => {
      const request = store.getAll();
      request.onsuccess = () =>
        result(
          (request.result as Habit[]).sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt),
          ),
        );
    }),
  create: async (input) => {
    const habit: Habit = {
      ...validate(input),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completions: [],
    };
    return storageTransaction("habits", "readwrite", (store, result) => {
      store.add(habit);
      result(habit);
    });
  },
  update: async (id, input) => {
    const next = validate(input);
    return changeHabit(id, (habit) => ({ ...habit, ...next }));
  },
  setCompletion: async (id, day, completed) => {
    if (!isDateKey(day) || day > dateKey(new Date()))
      throw new Error("Choose a valid date up to today.");
    return changeHabit(id, (habit) => ({
      ...habit,
      completions: completed
        ? [...new Set([...habit.completions, day])].sort()
        : habit.completions.filter((entry) => entry !== day),
    }));
  },
  remove: (id) =>
    storageTransaction("habits", "readwrite", (store, result) => {
      store.delete(id);
      result(undefined);
    }),
};
