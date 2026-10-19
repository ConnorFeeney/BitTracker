"use client";

import { useLayoutEffect, useRef } from "react";
import { dateKey, moveDate } from "@/lib/dates";

interface Props {
  counts: Record<string, number>;
  year: number;
  today: string;
  color?: string;
  label: string;
  onSelect?: (day: string) => void;
  disabled?: boolean;
}

export function ContributionGraph({
  counts,
  year,
  today,
  color = "#39d353",
  label,
  onSelect,
  disabled,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const centerToday = () => {
      const cell = container.querySelector<HTMLElement>(
        '[data-today="true"][data-outside="false"]',
      );
      if (!cell) return;
      const viewport = container.getBoundingClientRect();
      const target = cell.getBoundingClientRect();
      const centered =
        container.scrollLeft + target.left - viewport.left +
        target.width / 2 - container.clientWidth / 2;
      container.scrollLeft = Math.max(
        0,
        Math.min(centered, container.scrollWidth - container.clientWidth),
      );
    };

    centerToday();
    const observer = new ResizeObserver(centerToday);
    observer.observe(container);
    return () => observer.disconnect();
  }, [today, year]);

  const first = new Date(year, 0, 1, 12);
  const start = moveDate(first, -first.getDay());
  const last = new Date(year, 11, 31, 12);
  const weeks = Math.ceil(
    (Math.round((last.getTime() - start.getTime()) / 86400000) + 1) / 7,
  );
  const max = Math.max(
    1,
    ...Object.entries(counts)
      .filter(([day]) => day.startsWith(`${year}-`))
      .map(([, count]) => count),
  );
  const months = Array.from({ length: 12 }, (_, month) => {
    const date = new Date(year, month, 1, 12);
    return {
      name: date.toLocaleDateString("en", { month: "short" }),
      column:
        Math.floor(
          Math.round((date.getTime() - start.getTime()) / 86400000) / 7,
        ) + 1,
    };
  });
  const cells = Array.from({ length: weeks * 7 }, (_, index) => {
    const date = moveDate(start, index),
      key = dateKey(date);
    const outside = date.getFullYear() !== year,
      future = key > today;
    const count = counts[key] ?? 0;
    const level = count === 0 ? 0 : Math.max(1, Math.ceil((count / max) * 4));
    const title = `${date.toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}: ${count} completion${count === 1 ? "" : "s"}${onSelect && !future ? " · Click to toggle" : ""}`;
    const style = {
      backgroundColor: count
        ? `color-mix(in srgb, ${color} ${[0, 24, 46, 72, 100][level]}%, #0d1117)`
        : undefined,
    };
    return onSelect ? (
      <button
        key={key}
        type="button"
        className="contribution-cell"
        style={style}
        disabled={outside || future || disabled}
        data-outside={outside}
        data-future={future}
        data-today={key === today}
        title={outside ? undefined : title}
        aria-label={title}
        aria-pressed={count > 0}
        tabIndex={
          outside || future
            ? -1
            : key === (today.startsWith(String(year)) ? today : `${year}-12-31`)
              ? 0
              : -1
        }
        onClick={() => onSelect(key)}
        onKeyDown={(event) => {
          const step = {
            ArrowUp: -1,
            ArrowDown: 1,
            ArrowLeft: -7,
            ArrowRight: 7,
          }[event.key];
          if (!step) return;
          event.preventDefault();
          const next =
            gridRef.current?.querySelectorAll<HTMLButtonElement>("button")[
              index + step
            ];
          if (next && !next.disabled) {
            event.currentTarget.tabIndex = -1;
            next.tabIndex = 0;
            next.focus();
          }
        }}
      />
    ) : (
      <div
        key={key}
        className="contribution-cell"
        style={style}
        data-outside={outside}
        data-future={future}
        data-today={key === today}
        title={outside ? undefined : title}
        role="img"
        aria-label={outside ? "Outside selected year" : title}
      />
    );
  });
  return (
    <div ref={scrollRef} className="graph-scroll">
      <div className="contribution-graph" aria-label={`${label}, ${year}`}>
        <div
          className="graph-months"
          style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
        >
          {months.map((month) => (
            <span key={month.name} style={{ gridColumnStart: month.column }}>
              {month.name}
            </span>
          ))}
        </div>
        <div className="graph-weekdays" aria-hidden="true">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div
          ref={gridRef}
          className="graph-cells"
          style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
        >
          {cells}
        </div>
      </div>
    </div>
  );
}

export function GraphLegend({ color = "#39d353" }: { color?: string }) {
  return (
    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <span className="mr-1">Less</span>
      {[0, 24, 46, 72, 100].map((level) => (
        <span
          key={level}
          className="size-2.5 rounded-xs border border-white/5"
          style={{
            background: level
              ? `color-mix(in srgb, ${color} ${level}%, #0d1117)`
              : "#161b22",
          }}
        />
      ))}
      <span className="ml-1">More</span>
    </div>
  );
}

export function completionCounts(days: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const day of days) counts[day] = (counts[day] ?? 0) + 1;
  return counts;
}
