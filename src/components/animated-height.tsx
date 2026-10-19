"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Resize once between list and empty states rather than collapsing then reopening. */
export function AnimatedHeight({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const outer = outerRef.current,
      inner = innerRef.current;
    if (!outer || !inner) return;
    let previous = inner.getBoundingClientRect().height;
    let animation: Animation | undefined;
    const observer = new ResizeObserver(() => {
      const height = inner.getBoundingClientRect().height;
      if (Math.abs(height - previous) < 0.5) return;
      const from =
        animation?.playState === "running"
          ? outer.getBoundingClientRect().height
          : previous;
      previous = height;
      animation?.cancel();
      // Let multi-row removal run its own collapse without a second resize animation.
      if (inner.querySelector(".todo-completing:not(.todo-completing-last)")) {
        outer.style.height = "auto";
        return;
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        outer.style.height = "auto";
        return;
      }
      outer.style.height = `${height}px`;
      animation = outer.animate(
        [{ height: `${from}px` }, { height: `${height}px` }],
        { duration: 240, easing: "ease-out" },
      );
      animation.onfinish = () => {
        outer.style.height = "auto";
      };
    });
    observer.observe(inner);
    return () => {
      observer.disconnect();
      animation?.cancel();
    };
  }, []);
  return (
    <div ref={outerRef} className="overflow-hidden" data-animated-height>
      <div ref={innerRef} className="flow-root">
        {children}
      </div>
    </div>
  );
}
