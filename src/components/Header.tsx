"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";

const nav = [
  { href: "/", label: "Latest" },
  { href: "/patches", label: "Patches" },
  { href: "/champions", label: "Champions" },
  { href: "/calculator", label: "Calculator" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goHomeOrTop = useCallback(
    (e: React.MouseEvent) => {
      if (pathname === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      // else Link navigates home
    },
    [pathname],
  );

  return (
    <header
      data-scroll-sticky
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-sm transition-shadow",
        scrolled && "shadow-[0_1px_0_0_var(--line)]",
      )}
    >
      <div className="mx-auto flex h-11 max-w-[1200px] items-center gap-4 px-3 sm:gap-6 sm:px-5">
        <Link
          href="/"
          onClick={goHomeOrTop}
          className="group shrink-0 transition-opacity hover:opacity-90"
          aria-label="RiftIntel — home"
          title={pathname === "/" ? "Back to top" : "RiftIntel home"}
        >
          <BrandMark size="sm" />
        </Link>

        <nav className="hidden flex-1 items-center gap-0 md:flex">
          {nav.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-2.5 py-1 font-data text-[12px] tracking-wide transition-colors",
                  active
                    ? "text-fg"
                    : "text-[var(--fg-faint)] hover:text-fg-dim",
                )}
              >
                {active && (
                  <span className="mr-1 text-accent" aria-hidden>
                    ›
                  </span>
                )}
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {scrolled && (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hidden font-data text-[10px] text-[var(--fg-faint)] transition hover:text-muted sm:inline"
              title="Back to top"
            >
              ↑ top
            </button>
          )}
          <button
            type="button"
            className="font-data text-[11px] text-muted md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "close" : "menu"}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border px-3 py-2 md:hidden">
          <Link
            href="/"
            onClick={(e) => {
              setOpen(false);
              goHomeOrTop(e);
            }}
            className="mb-1 block py-2 font-data text-[12px] text-accent"
          >
            RiftIntel · home
          </Link>
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block py-2 font-data text-[13px] text-fg"
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
