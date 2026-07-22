import { cn } from "@/lib/utils";

/**
 * Placeholder for future ad / sponsor inventory.
 * Kept tasteful and labeled so the free product stays monetizable
 * without breaking trust.
 */
export function AdSlot({
  label = "Sponsored",
  className,
  size = "banner",
}: {
  label?: string;
  className?: string;
  size?: "banner" | "square" | "inline";
}) {
  const dims =
    size === "banner"
      ? "min-h-[90px]"
      : size === "square"
        ? "min-h-[250px]"
        : "min-h-[60px]";

  return (
    <aside
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-surface/50 px-4 py-3 text-center",
        dims,
        className,
      )}
      aria-label="Advertisement placeholder"
    >
      <span className="text-[10px] text-muted/50">{label}</span>
    </aside>
  );
}
