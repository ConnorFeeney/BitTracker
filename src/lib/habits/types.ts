export const habitColors = {
  green: "#39d353",
  blue: "#58a6ff",
  purple: "#bc8cff",
  orange: "#f2a65a",
  pink: "#f778ba",
} as const;
export type HabitColor = keyof typeof habitColors;
export interface Habit {
  id: string;
  name: string;
  description: string;
  color: HabitColor;
  createdAt: string;
  completions: string[];
}
export type HabitInput = Pick<Habit, "name" | "description" | "color">;
/** UI-facing asynchronous boundary. A future HTTP adapter implements this contract. */
export interface HabitRepository {
  list(): Promise<Habit[]>;
  create(input: HabitInput): Promise<Habit>;
  update(id: string, input: HabitInput): Promise<Habit>;
  setCompletion(id: string, day: string, completed: boolean): Promise<Habit>;
  remove(id: string): Promise<void>;
}
