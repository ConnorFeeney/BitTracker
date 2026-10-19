# Architecture

Next.js App Router serves two pages: habits at `/` and to-dos at `/todos`. Interactive components use React state; Tailwind and shadcn/ui provide the interface.

## Main files

| Location | Purpose |
| --- | --- |
| `src/components/dashboard.tsx` | Habit dashboard and statistics. |
| `src/components/todos-page.tsx` | To-do groups, filters, and completion. |
| `src/components/contribution-graph.tsx` | Calendar graphs and mobile centering. |
| `src/lib/habits/`, `src/lib/todos/` | Repository interfaces and persistence. |
| `src/lib/storage.ts` | Shared IndexedDB connection and transactions. |
| `src/lib/dates.ts` | Local calendar dates and streaks. |
| `src/app/globals.css` | Theme and animations. |

## Storage

The browser's `bit-tracker` database is version 2, with separate `habits` and `todos` stores. The upgrade preserves existing habits. UI components call asynchronous repository APIs; writes resolve after transactions commit.

Dates use local `YYYY-MM-DD` keys and calendar arithmetic. Completing a to-do permanently deletes its record before animating the row away. Motion respects the device's reduced-motion preference.

## Hosting

Docker builds Next.js standalone output and serves it from a minimal non-root Alpine/Node container. All user data stays in the browser.
