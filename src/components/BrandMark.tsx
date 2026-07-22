import { cn } from "@/lib/utils";

/**
 * RiftIntel brand mark — scan node + wordmark.
 * Geometry: ring (scan) · node (focus) · ticks (orientation) · blips (signal).
 */
export function BrandMark({
  className,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const icon = size === "sm" ? 18 : size === "lg" ? 28 : 22;
  const word =
    size === "sm"
      ? "text-[12px]"
      : size === "lg"
        ? "text-[16px]"
        : "text-[13px]";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0"
      >
        {/* Outer scan ring */}
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="currentColor"
          strokeWidth="1.25"
          className="text-[var(--brand-ring)]"
          opacity="0.55"
        />
        {/* Inner node */}
        <circle cx="16" cy="16" r="3.5" fill="currentColor" className="text-accent" />
        {/* Compass ticks — N E S W */}
        <path
          d="M16 4v4M16 24v4M4 16h4M24 16h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
          className="text-accent"
        />
        {/* Diagonal signal blips */}
        <path
          d="M8.5 8.5l2.2 2.2M21.3 21.3l2.2 2.2M21.3 8.5l-2.2 2.2M10.7 21.3l-2.2 2.2"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="square"
          className="text-[var(--brand-signal)]"
          opacity="0.9"
        />
      </svg>
      {showWordmark && (
        <span className={cn("flex items-baseline gap-0 leading-none font-data font-semibold tracking-tight", word)}>
          <span className="text-fg">Rift</span>
          <span className="text-accent">Intel</span>
        </span>
      )}
    </span>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-data font-semibold tracking-tight", className)}>
      <span className="text-fg">Rift</span>
      <span className="text-accent">Intel</span>
    </span>
  );
}
