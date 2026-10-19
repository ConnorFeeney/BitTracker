export const habitColors = {
  green: "#39d353",
  blue: "#58a6ff",
  purple: "#bc8cff",
  orange: "#f2a65a",
  pink: "#f778ba",
} as const;
export type HabitColor = keyof typeof habitColors;
export const allWeekdays = [0, 1, 2, 3, 4, 5, 6];
export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** An empty selection means the habit is tracked every day. */
export function trackedWeekdays(weekdays?: number[]): number[] {
  return weekdays?.length ? weekdays : allWeekdays;
}
export interface Habit {
  id: string;
  name: string;
  description: string;
  color: HabitColor;
  weekdays: number[];
  createdAt: string;
  completions: string[];
}
export type HabitInput = Pick<Habit, "name" | "description" | "color" | "weekdays">;
/** UI-facing asynchronous boundary. A future HTTP adapter implements this contract. */
export interface HabitRepository {
  list(): Promise<Habit[]>;
  create(input: HabitInput): Promise<Habit>;
  update(id: string, input: HabitInput): Promise<Habit>;
  setCompletion(id: string, day: string, completed: boolean): Promise<Habit>;
  remove(id: string): Promise<void>;
}
