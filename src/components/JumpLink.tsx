"use client";

import type { ReactNode, MouseEvent } from "react";
import { scrollToId } from "@/lib/scroll";
import { cn } from "@/lib/utils";

/** In-page anchor that clears sticky header/filter offset. */
export function JumpLink({
  id,
  children,
  className,
  title,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <a
      href={`#${id}`}
      title={title}
      onClick={onClick}
      className={cn(className)}
    >
      {children}
    </a>
  );
}
