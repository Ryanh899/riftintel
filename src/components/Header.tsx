"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";

const nav = [
  { href: "/", label: "Patch" },
  { href: "/patches", label: "Patches" },
  { href: "/champions", label: "Champs" },
  { href: "/calculator", label: "Dmg" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      data-scroll-sticky
      className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-11 max-w-[1200px] items-center gap-6 px-3 sm:px-5">
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-90"
          aria-label="RiftIntel home"
        >
          <BrandMark />
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

        <button
          type="button"
          className="ml-auto font-data text-[11px] text-muted md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "close" : "menu"}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border px-3 py-2 md:hidden">
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
