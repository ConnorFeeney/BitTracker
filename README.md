# Bit Tracker

A habit tracker and to-do list built with Next.js, React, Tailwind CSS, and shadcn/ui. Data is saved locally in your browser using IndexedDB.

- Habit contribution graphs, daily check-ins, and streaks.
- To-dos with due dates, overdue groups, tags, and search.
- Mobile swipe actions and reduced-motion support.

## Run locally

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>. If port 3000 is occupied, use `npm run dev -- --port 3001`.

## Docker

The included Compose file builds the app locally:

```sh
docker compose up -d --build
```

Open <http://localhost:3000>. Stop it with `docker compose down`.

The multi-stage image uses a minimal Alpine/Node runtime and runs as a non-root user. No database or volume is needed. Use HTTPS when hosting remotely.

## Data

Use the same address and browser profile to access your data. Changing the hostname, protocol, or port uses separate storage. Clearing browser site data removes habits and to-dos; there is no server backup.

## Documentation

- [Usage](docs/usage.md)
- [Architecture](docs/arch.md)
- [Contributing](CONTRIBUTING.md)
