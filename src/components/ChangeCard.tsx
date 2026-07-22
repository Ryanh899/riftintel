import Link from "next/link";
import type { AbilityChange, EntityChange, StatLine } from "@/lib/types";
import { cn, entityAnchorId, slugify } from "@/lib/utils";
import { DirectionDot } from "./DirectionBadge";
import { EntityIcon } from "./EntityIcon";
import { AbilityMark } from "./AbilityMark";
import { cleanTldr } from "@/lib/text";

/**
 * Change row — numbers first, prose second.
 * Scan the ability + before→after block; read text only if you want context.
 */
export function ChangeCard({
  entity,
  patchId,
  showHistoryLink = true,
}: {
  entity: EntityChange;
  patchId?: string;
  showHistoryLink?: boolean;
  compact?: boolean;
}) {
  const historyHref =
    entity.type === "champion"
      ? `/champions/${slugify(entity.name)}`
      : entity.type === "item"
        ? `/items/${slugify(entity.name)}`
        : null;

  const tldr = cleanTldr(entity.tldr, 200);
  const impact = cleanTldr(entity.gameplayImpact, 160);
  const showImpact =
    impact &&
    impact.toLowerCase() !== tldr.toLowerCase() &&
    !tldr.toLowerCase().includes(impact.slice(0, 40).toLowerCase());

  // If tldr just restates the number lines, keep prose even quieter / shorter.
  const proseSecondary = entity.changes.length > 0;

  return (
    <article
      id={entityAnchorId(entity)}
      className="scroll-mt-[var(--scroll-offset,7.5rem)] border-b border-border py-4 first:pt-0"
    >
      <div className="flex gap-3">
        <div className="relative shrink-0 pt-0.5">
          <EntityIcon entity={entity} size={40} className="!rounded-none" />
          <DirectionDot
            direction={entity.direction}
            className="absolute -right-0.5 -top-0.5 ring-2 ring-bg"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Identity */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="text-[14px] font-semibold tracking-tight text-fg">
              {entity.name}
            </h3>
            <span
              className={cn(
                "font-data text-[11px] font-medium uppercase tracking-wide",
                entity.direction === "buff" && "text-buff",
                entity.direction === "nerf" && "text-nerf",
                entity.direction === "adjust" && "text-adjust",
                entity.direction === "rework" && "text-rework",
                !["buff", "nerf", "adjust", "rework"].includes(
                  entity.direction,
                ) && "text-muted",
              )}
            >
              {entity.direction}
            </span>
            {showHistoryLink && historyHref && (
              <Link
                href={historyHref}
                className="font-data text-[11px] text-muted hover:text-accent"
              >
                hist
              </Link>
            )}
            {patchId && (
              <span className="font-data text-[11px] text-muted/80">
                {patchId}
              </span>
            )}
          </div>

          {/* DATA FIRST — ability blocks with numbers */}
          {entity.changes.length > 0 ? (
            <div className="space-y-2">
              {entity.changes.map((ability, i) => (
                <AbilityBlock key={`${ability.ability}-${i}`} ability={ability} />
              ))}
            </div>
          ) : tldr ? (
            /* No structured lines — fall back to tldr as primary */
            <p className="text-[13px] leading-snug text-fg/90">{tldr}</p>
          ) : null}

          {/* PROSE SECOND — optional context under the numbers */}
          {entity.changes.length > 0 && tldr && (
            <div
              className={cn(
                "space-y-1 border-t border-border/60 pt-2",
                proseSecondary && "opacity-90",
              )}
            >
              <p className="text-[12px] leading-snug text-muted">{tldr}</p>
              {showImpact && (
                <p className="text-[11px] leading-snug text-[var(--fg-faint)]">
                  {impact}
                </p>
              )}
            </div>
          )}
          {entity.changes.length === 0 && showImpact && (
            <p className="text-[12px] leading-snug text-muted">{impact}</p>
          )}
        </div>
      </div>
    </article>
  );
}

function AbilityBlock({ ability }: { ability: AbilityChange }) {
  return (
    <div className="rounded-[var(--radius)] border border-border/80 bg-[var(--ink)]/40">
      {/* Ability header */}
      <div className="flex items-center gap-2 border-b border-border/60 px-2.5 py-1.5">
        <AbilityMark
          ability={ability.ability}
          title={ability.title}
          className="min-w-0"
        />
      </div>

      {/* Number rows */}
      <ul className="divide-y divide-border/50">
        {ability.lines.map((line, j) => (
          <StatRow key={j} line={line} ability={ability} />
        ))}
      </ul>
    </div>
  );
}

function StatRow({
  line,
  ability,
}: {
  line: StatLine;
  ability: AbilityChange;
}) {
  const hasValues = Boolean(line.before || line.after);
  const label =
    line.label && line.label !== "Change"
      ? line.label
      : ability.title && ability.title !== ability.ability
        ? ability.title
        : null;

  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-2.5 py-1.5">
      <span className="min-w-0 flex-1 text-[12px] leading-snug text-muted">
        {label || (hasValues ? "" : "Change")}
      </span>

      <span className="shrink-0 font-data text-[12px] leading-snug">
        {!hasValues && line.note ? (
          <span className="font-sans text-[12px] text-fg/85">
            {truncate(line.note, 110)}
          </span>
        ) : (
          <span className="inline-flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5">
            {line.before && (
              <span className="text-muted/65 line-through decoration-muted/40">
                {truncate(line.before, 36)}
              </span>
            )}
            {line.before && line.after && (
              <span className="text-[var(--fg-faint)]" aria-hidden>
                →
              </span>
            )}
            {line.after && (
              <span className="font-semibold tabular-nums text-fg">
                {truncate(line.after, 36)}
              </span>
            )}
            {line.delta && (
              <span
                className={cn(
                  "text-[11px] font-semibold tabular-nums",
                  line.delta.startsWith("−") || line.delta.startsWith("-")
                    ? "text-nerf"
                    : line.delta.startsWith("+")
                      ? "text-buff"
                      : "text-adjust",
                )}
              >
                {line.delta}
              </span>
            )}
          </span>
        )}
      </span>
    </li>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
