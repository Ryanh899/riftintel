import {
  abilityKeyClass,
  resolveAbilityLabel,
  type AbilitySlot,
} from "@/lib/abilities";
import { cn } from "@/lib/utils";

/**
 * Ability slot marker: letter (+ optional name).
 * compact → "Q" only; default → "Q · Charm"
 */
export function AbilityMark({
  ability,
  title,
  letter,
  name,
  compact = false,
  className,
}: {
  /** Raw ability field from patch data */
  ability?: string | null;
  title?: string | null;
  /** Override letter when known (calculator) */
  letter?: AbilitySlot | string | null;
  name?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const resolved = (() => {
    if (letter == null || letter === "") {
      return resolveAbilityLabel(ability, title ?? name);
    }
    const L = String(letter).toUpperCase();
    const slot = (
      ["P", "Q", "W", "E", "R", "BASE", "GEN", "SYS"].includes(L) ? L : "OTHER"
    ) as AbilitySlot;
    const key =
      slot === "OTHER" ? "·" : slot === "BASE" ? "BASE" : slot === "GEN" ? "GEN" : slot === "SYS" ? "SYS" : slot;
    const displayName = (name || title || "").trim();
    return {
      key,
      letter: slot,
      name: displayName,
      full: displayName ? `${key} · ${displayName}` : key,
      compact: key,
    };
  })();

  const showName = !compact && resolved.name;
  const color = abilityKeyClass(resolved.letter);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-baseline gap-1.5 font-data",
        className,
      )}
      title={resolved.full}
    >
      <span
        className={cn(
          "inline-flex min-w-[1.25rem] shrink-0 items-center justify-center border border-border bg-[var(--ink)] px-1 py-0.5 text-[11px] font-semibold leading-none tracking-wide",
          color,
        )}
      >
        {resolved.key}
      </span>
      {showName && (
        <span className="truncate text-[12px] font-medium text-fg/90">
          {resolved.name}
        </span>
      )}
    </span>
  );
}
