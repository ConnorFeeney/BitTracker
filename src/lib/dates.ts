/** Calendar dates are local YYYY-MM-DD keys; never convert them through UTC. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDate(key: string): Date {
  return new Date(`${key}T12:00:00`);
}
export function moveDate(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
export function isDateKey(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parseDate(value).getTime()) &&
    dateKey(parseDate(value)) === value
  );
}
export function currentStreak(completions: string[], today: string): number {
  const done = new Set(completions);
  let cursor = parseDate(today),
    count = 0;
  if (!done.has(dateKey(cursor))) cursor = moveDate(cursor, -1);
  while (done.has(dateKey(cursor))) {
    count++;
    cursor = moveDate(cursor, -1);
  }
  return count;
}
export function longestStreak(completions: string[]): number {
  let best = 0,
    current = 0,
    previous = "";
  for (const day of [...new Set(completions)].sort()) {
    current =
      previous && dateKey(moveDate(parseDate(previous), 1)) === day
        ? current + 1
        : 1;
    best = Math.max(best, current);
    previous = day;
  }
  return best;
}
