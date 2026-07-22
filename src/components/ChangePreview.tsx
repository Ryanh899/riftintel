import type {
  AbilityChange,
  ChangeDirection,
  EntityChange,
  StatLine,
} from "@/lib/types";
import { directionLabel } from "@/lib/utils";
import { EntityIcon } from "./EntityIcon";
import { DirectionDot } from "./DirectionBadge";
import { AbilityMark } from "./AbilityMark";
import { cleanTldr } from "@/lib/text";

/** Hover card — numbers first when available, then short tldr. */
export function ChangePreview({
  entity,
  patchVersion,
}: {
  entity: Pick<
    EntityChange,
    | "name"
    | "type"
    | "direction"
    | "severity"
    | "tldr"
    | "assetKey"
    | "gameplayImpact"
  > & {
    changes?: AbilityChange[];
  };
  patchVersion?: string;
}) {
  const lines = flattenLines(entity.changes).slice(0, 4);
  const tldr = cleanTldr(entity.tldr, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <EntityIcon
          entity={{
            name: entity.name,
            type: entity.type,
            direction: entity.direction,
            assetKey: entity.assetKey,
          }}
          size={28}
          className="!rounded-none"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-fg">
              {entity.name}
            </span>
            <DirectionDot direction={entity.direction} />
            <span className="font-data text-[10px] uppercase text-muted">
              {directionLabel(entity.direction)}
            </span>
          </div>
          {patchVersion && (
            <p className="font-data text-[10px] text-[var(--fg-faint)]">
              {patchVersion}
            </p>
          )}
        </div>
      </div>

      {lines.length > 0 ? (
        <ul className="space-y-1 border-t border-border pt-2">
          {lines.map((row, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between gap-2 font-data text-[11px]"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <AbilityMark
                  ability={row.ability}
                  title={row.title}
                  compact
                />
                <span className="truncate text-muted">
                  {row.label !== "Change" ? row.label : ""}
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-fg">
                {row.before && (
                  <span className="text-muted/60 line-through">
                    {short(row.before, 14)}
                  </span>
                )}
                {row.before && row.after && (
                  <span className="mx-0.5 text-[var(--fg-faint)]">→</span>
                )}
                {row.after && (
                  <span className="font-semibold">{short(row.after, 14)}</span>
                )}
                {!row.before && !row.after && row.note && (
                  <span className="font-sans text-fg/80">
                    {short(row.note, 40)}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        tldr && (
          <p className="text-[12px] leading-snug text-fg/90">{tldr}</p>
        )
      )}

      {lines.length > 0 && tldr && (
        <p className="line-clamp-2 text-[11px] leading-snug text-[var(--fg-faint)]">
          {tldr}
        </p>
      )}
    </div>
  );
}

function flattenLines(
  changes?: AbilityChange[],
): Array<StatLine & { ability: string; title?: string | null }> {
  if (!changes?.length) return [];
  const out: Array<StatLine & { ability: string; title?: string | null }> = [];
  for (const a of changes) {
    for (const line of a.lines) {
      out.push({ ...line, ability: a.ability, title: a.title });
    }
  }
  return out;
}

function short(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function PatchPreviewContent({
  version,
  title,
  summary,
  buffs,
  nerfs,
  adjusts,
  highlights,
}: {
  version: string;
  title: string;
  summary?: string;
  buffs: number;
  nerfs: number;
  adjusts: number;
  highlights?: { name: string; direction: ChangeDirection; tldr: string }[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-data text-[15px] font-semibold text-fg">
          {version}
        </span>
        <span className="font-data text-[10px] text-muted">
          <span className="text-buff">{buffs}</span>
          <span className="text-[var(--fg-faint)]">/</span>
          <span className="text-nerf">{nerfs}</span>
          <span className="text-[var(--fg-faint)]">/</span>
          <span className="text-adjust">{adjusts}</span>
        </span>
      </div>
      {summary && (
        <p className="line-clamp-3 text-[11px] leading-snug text-muted">
          {summary}
        </p>
      )}
      {highlights && highlights.length > 0 && (
        <ul className="space-y-1 border-t border-border pt-2">
          {highlights.slice(0, 5).map((h) => (
            <li key={h.name} className="flex gap-1.5 text-[11px]">
              <DirectionDot direction={h.direction} className="mt-1" />
              <span className="min-w-0">
                <span className="font-medium text-fg">{h.name}</span>
                <span className="text-muted">
                  {" "}
                  {cleanTldr(h.tldr, 55)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {title && !title.startsWith("Patch") && title.length < 50 && (
        <p className="font-data text-[10px] text-[var(--fg-faint)]">{title}</p>
      )}
    </div>
  );
}
