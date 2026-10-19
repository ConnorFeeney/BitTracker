"use client";

import { useRef, useState, type ReactNode } from "react";
import { MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Swipe the non-interactive content left; explicit controls also work with a keyboard. */
export function ItemActions({
  label,
  onEdit,
  onDelete,
  disabled,
  children,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const origin = useRef<{
    x: number;
    y: number;
    offset: number;
    horizontal: boolean;
  } | null>(null);
  const moved = useRef(false);
  const open = offset < -40;
  return (
    <div
      className="item-actions group/actions relative overflow-hidden"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOffset(0);
      }}
    >
      <div
        className="absolute inset-y-0 right-0 flex w-36 items-stretch"
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          disabled={disabled}
          className="flex w-1/2 flex-col items-center justify-center gap-1 bg-blue-500/15 text-xs text-blue-300 hover:bg-blue-500/25"
          aria-label={`Edit ${label}`}
          onClick={() => {
            setOffset(0);
            onEdit();
          }}
        >
          <Pencil className="size-4" />
          Edit
        </button>
        <button
          type="button"
          disabled={disabled}
          className="flex w-1/2 flex-col items-center justify-center gap-1 bg-destructive/15 text-xs text-destructive hover:bg-destructive/25"
          aria-label={`Delete ${label}`}
          onClick={() => {
            setOffset(0);
            onDelete();
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </button>
      </div>
      <div
        className="relative bg-background"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 180ms ease",
          touchAction: "pan-y",
        }}
        onPointerDown={(event) => {
          moved.current = false;
          if (
            disabled ||
            event.pointerType !== "touch" ||
            (event.target as HTMLElement).closest(
              "button, a, input, textarea, select, .graph-scroll, [data-no-swipe]",
            )
          )
            return;
          origin.current = {
            x: event.clientX,
            y: event.clientY,
            offset,
            horizontal: false,
          };
          moved.current = false;
        }}
        onPointerMove={(event) => {
          const start = origin.current;
          if (!start) return;
          const dx = event.clientX - start.x,
            dy = event.clientY - start.y;
          if (!start.horizontal) {
            if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
              origin.current = null;
              return;
            }
            if (Math.abs(dx) < 10) return;
            start.horizontal = true;
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          moved.current = true;
          setOffset(Math.max(-144, Math.min(0, start.offset + dx)));
        }}
        onPointerUp={() => {
          if (origin.current?.horizontal)
            setOffset((value) => (value < -40 ? -144 : 0));
          origin.current = null;
          setDragging(false);
        }}
        onPointerCancel={() => {
          origin.current = null;
          setDragging(false);
          setOffset((value) => (value < -40 ? -144 : 0));
        }}
        onClickCapture={(event) => {
          if (moved.current) {
            event.preventDefault();
            event.stopPropagation();
            moved.current = false;
          }
        }}
      >
        <div className="flex items-start">
          <div className="min-w-0 flex-1">{children}</div>
          <div className="hidden shrink-0 items-center gap-0.5 px-2 pt-3 md:flex">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label={`${open ? "Close" : "Show"} actions for ${label}`}
              aria-expanded={open}
              onClick={() => setOffset(open ? 0 : -144)}
            >
              {open ? <X /> : <MoreHorizontal />}
            </Button>
          </div>
          <button
            type="button"
            className="sr-only focus:not-sr-only md:hidden"
            disabled={disabled}
            aria-label={`${open ? "Close" : "Show"} actions for ${label}`}
            aria-expanded={open}
            onClick={() => setOffset(open ? 0 : -144)}
          >
            {open ? "Close actions" : "Item actions"}
          </button>
        </div>
      </div>
    </div>
  );
}
