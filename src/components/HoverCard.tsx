"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function HoverCard({
  content,
  children,
  className,
  panelClassName,
  delay = 80,
  disabled,
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  delay?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    place: "below" as "below" | "above",
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uid = useId();

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const position = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelW = 280;
    const pad = 8;
    let left = r.left + r.width / 2 - panelW / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - panelW - pad));
    const place =
      window.innerHeight - r.bottom < 200 && r.top > 200 ? "above" : "below";
    setCoords({
      top: place === "below" ? r.bottom + 6 : r.top - 6,
      left,
      place,
    });
  }, []);

  const show = () => {
    if (disabled) return;
    clear();
    timer.current = setTimeout(() => {
      position();
      setOpen(true);
    }, delay);
  };

  const hide = () => {
    clear();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onMove = () => position();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, position]);

  return (
    <div
      ref={triggerRef}
      className={cn("relative", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={open ? uid : undefined}
    >
      {children}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={uid}
            role="tooltip"
            className={cn(
              "z-[100] w-[280px] border border-[var(--line-strong)] bg-[var(--panel)] p-2.5 shadow-xl shadow-black/50",
              panelClassName,
            )}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform:
                coords.place === "above" ? "translateY(-100%)" : undefined,
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
}
