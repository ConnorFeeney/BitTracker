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
function scheduled(date: Date, weekdays: number[]): boolean {
  return weekdays.length === 0 || weekdays.includes(date.getDay());
}

function previousScheduled(date: Date, weekdays: number[]): Date {
  let cursor = moveDate(date, -1);
  while (!scheduled(cursor, weekdays)) cursor = moveDate(cursor, -1);
  return cursor;
}

export function currentStreak(
  completions: string[],
  today: string,
  weekdays: number[] = [0, 1, 2, 3, 4, 5, 6],
): number {
  const done = new Set(completions);
  let cursor = parseDate(today);
  if (!scheduled(cursor, weekdays) || !done.has(dateKey(cursor)))
    cursor = previousScheduled(cursor, weekdays);
  let count = 0;
  while (done.has(dateKey(cursor))) {
    count++;
    cursor = previousScheduled(cursor, weekdays);
  }
  return count;
}
export function longestStreak(
  completions: string[],
  weekdays: number[] = [0, 1, 2, 3, 4, 5, 6],
): number {
  let best = 0,
    current = 0,
    previous = "";
  for (const day of [...new Set(completions)]
    .sort()
    .filter((day) => scheduled(parseDate(day), weekdays))) {
    current =
      previous && dateKey(previousScheduled(parseDate(day), weekdays)) === previous
        ? current + 1
        : 1;
    best = Math.max(best, current);
    previous = day;
  }
  return best;
}
