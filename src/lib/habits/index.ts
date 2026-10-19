import { indexedDbRepository } from "./indexed-db";
import type { HabitRepository } from "./types";
// Replace only this adapter with an HTTP repository when adding a backend/accounts.
export const habitRepository: HabitRepository = indexedDbRepository;
export { habitColors } from "./types";
export type { Habit, HabitInput, HabitColor, HabitRepository } from "./types";
