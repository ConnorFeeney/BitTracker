import Link from "next/link";
import { ListTodo, Grid2X2 } from "lucide-react";

export function BitMark({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`grid shrink-0 grid-cols-3 gap-0.75 ${small ? "size-4" : "size-7"}`}
      aria-hidden="true"
    >
      {[20, 60, 100, 60, 100, 35, 100, 35, 15].map((opacity, index) => (
        <span
          key={index}
          className="rounded-xs"
          style={{
            background: `color-mix(in srgb, #39d353 ${opacity}%, #0d1117)`,
          }}
        />
      ))}
    </span>
  );
}

export function AppHeader({ active }: { active: "habits" | "todos" }) {
  return (
    <header className="border-b border-border bg-[#010409]">
      <div className="mx-auto flex h-18 max-w-360 items-center justify-between gap-3 px-5 md:px-10">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Bit Tracker home"
        >
          <BitMark />
          <span className="text-lg font-semibold tracking-tight">
            bit<span className="text-muted-foreground">tracker</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex gap-1">
          {(
            [
              { href: "/", key: "habits", text: "Habits", Icon: Grid2X2 },
              { href: "/todos", key: "todos", text: "To-dos", Icon: ListTodo },
            ] as const
          ).map(({ href, key, text, Icon }) => (
            <Link
              key={key}
              href={href}
              aria-current={active === key ? "page" : undefined}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${active === key ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}
            >
              <Icon className="hidden size-3.5 sm:block" />
              {text}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
