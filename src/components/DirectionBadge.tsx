import type { ChangeDirection, Severity } from "@/lib/types";
import { cn, directionLabel } from "@/lib/utils";

const dirClass: Record<ChangeDirection, string> = {
  buff: "text-buff",
  nerf: "text-nerf",
  adjust: "text-adjust",
  rework: "text-rework",
  new: "text-new",
  remove: "text-muted",
};

/** Minimal direction marker — letter + color, not a pill badge */
export function DirectionBadge({
  direction,
  severity,
  size = "md",
}: {
  direction: ChangeDirection;
  severity?: Severity;
  size?: "sm" | "md";
}) {
  const letter =
    direction === "buff"
      ? "B"
      : direction === "nerf"
        ? "N"
        : direction === "adjust"
          ? "A"
          : direction === "rework"
            ? "R"
            : direction === "new"
              ? "+"
              : "–";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-data font-semibold uppercase",
        dirClass[direction],
        size === "sm" ? "text-[10px]" : "text-[11px]",
      )}
      title={
        severity != null
          ? `${directionLabel(direction)} · sev ${severity}`
          : directionLabel(direction)
      }
    >
      <span className="opacity-90">{letter}</span>
      {size !== "sm" && (
        <span className="font-normal tracking-wide opacity-70">
          {directionLabel(direction)}
        </span>
      )}
    </span>
  );
}

export function DirectionDot({
  direction,
  className,
}: {
  direction: ChangeDirection;
  className?: string;
}) {
  const bg: Record<ChangeDirection, string> = {
    buff: "bg-buff",
    nerf: "bg-nerf",
    adjust: "bg-adjust",
    rework: "bg-rework",
    new: "bg-new",
    remove: "bg-muted",
  };
  return (
    <span
      className={cn("inline-block h-1.5 w-1.5 shrink-0", bg[direction], className)}
      title={directionLabel(direction)}
    />
  );
}
