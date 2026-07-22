"use client";

import { X } from "lucide-react";
import type { CompareNoteLine } from "@/lib/calculator/patchReverse";
import { cn } from "@/lib/utils";

export type ChampPatchOption = {
  id: string;
  version: string;
  direction: string;
};

/** Short label for the “other kit” side */
export function otherKitLabel(
  patch: ChampPatchOption | null | undefined,
  lastOnId: string | null,
): string {
  if (!patch) return "older kit";
  if (lastOnId && patch.id === lastOnId) {
    return `${patch.version} (last adj)`;
  }
  const dir = patch.direction ? ` · ${patch.direction}` : "";
  return `${patch.version}${dir}`;
}

export function liveKitLabel(liveVersion: string): string {
  const short = liveVersion.replace(/^(\d+\.\d+).*/, "$1");
  return `${short} (Live)`;
}

/**
 * Collapsed: quiet dropdown. Active: full compare chrome + close control.
 */
export function PatchCompareControls({
  patches,
  value,
  onChange,
  liveVersion,
  champName,
  loading,
  applied,
  skipped,
}: {
  patches: ChampPatchOption[];
  value: string | null;
  onChange: (patchId: string | null) => void;
  liveVersion: string;
  champName?: string;
  loading?: boolean;
  applied?: number;
  skipped?: number;
}) {
  const lastOn = patches[0] ?? null;
  const selected = patches.find((p) => p.id === value) ?? null;
  const who = champName || "this champion";
  const liveLabel = liveKitLabel(liveVersion);
  const otherLabel = otherKitLabel(selected, lastOn?.id ?? null);
  const active = Boolean(value && selected);

  if (loading) {
    return (
      <p className="mb-2 font-data text-[10px] text-[var(--fg-faint)]">
        loading balance history…
      </p>
    );
  }

  if (!patches.length) {
    return null;
  }

  if (!active) {
    return (
      <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-border/60 pb-2">
        <span className="font-data text-[11px] text-muted">compare kits</span>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          className="min-w-[9.5rem] border border-border bg-[var(--panel)] px-2 py-1 font-data text-[12px] text-fg outline-none focus:border-accent"
          aria-label="Compare same build to an older balance patch"
        >
          <option value="">off</option>
          {patches.map((p, i) => (
            <option key={p.id} value={p.id}>
              {i === 0 ? "last adj · " : ""}
              {p.version}
              {p.direction ? ` (${p.direction})` : ""}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="mb-3 border border-accent/25 bg-[var(--ink)]/50">
      <div className="flex items-start gap-2 border-b border-border px-2.5 py-2">
        <div className="min-w-0 flex-1">
          <div className="font-data text-[13px] font-semibold tracking-tight text-fg">
            <span className="text-buff">{liveLabel}</span>
            <span className="mx-1.5 text-[var(--fg-faint)]">vs</span>
            <span className="text-accent">{otherLabel}</span>
          </div>
          <p className="mt-1 max-w-xl font-data text-[11px] leading-snug text-muted">
            Same build both sides.{" "}
            <span className="text-fg">Live</span> = today&apos;s kit.{" "}
            <span className="text-fg">{selected!.version}</span> = {who}
            &apos;s numbers after that balance patch. Deltas show how much
            stronger Live is.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex shrink-0 items-center gap-1 border border-border px-2 py-1 font-data text-[11px] text-muted transition hover:border-nerf/50 hover:bg-nerf/10 hover:text-fg"
          aria-label="Close compare"
          title="Close compare"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Close
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-2.5 py-1.5">
        <label className="font-data text-[11px] text-muted">
          older kit
          <select
            value={value ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : e.target.value)
            }
            className="ml-1.5 min-w-[9.5rem] max-w-[14rem] border border-border bg-[var(--panel)] px-2 py-1 font-data text-[12px] text-fg"
          >
            {patches.map((p, i) => (
              <option key={p.id} value={p.id}>
                {i === 0 ? "last adj · " : ""}
                {p.version}
                {p.direction ? ` (${p.direction})` : ""}
              </option>
            ))}
          </select>
        </label>

        {(applied != null || skipped != null) && (
          <span className="font-data text-[10px] text-[var(--fg-faint)]">
            {applied ?? 0} notes mapped
            {(skipped ?? 0) > 0 ? ` · ${skipped} skipped` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

/** Patch-note numbers that explain Live vs older kit (with patch ids). */
export function ComparePatchNotes({
  lines,
  liveLabel,
  otherLabel,
  baselineVersion,
}: {
  lines: CompareNoteLine[];
  liveLabel: string;
  otherLabel: string;
  baselineVersion: string;
}) {
  if (!lines.length) {
    return (
      <div className="mb-3 border border-border px-2.5 py-2 font-data text-[11px] text-[var(--fg-faint)]">
        No balance notes after {baselineVersion} in our data — Live kit matches
        that patch for tracked ability lines.
      </div>
    );
  }

  // Group by patch version (newest last → show newest first for scanning)
  const byPatch = new Map<string, CompareNoteLine[]>();
  for (const line of lines) {
    const list = byPatch.get(line.patchVersion) ?? [];
    list.push(line);
    byPatch.set(line.patchVersion, list);
  }
  const patchOrder = [...byPatch.keys()].reverse();

  return (
    <div className="mb-3 border border-border">
      <div className="border-b border-border px-2.5 py-1.5">
        <div className="font-data text-[12px] font-semibold text-fg">
          Patch notes since {baselineVersion}
        </div>
        <p className="mt-0.5 font-data text-[10px] text-[var(--fg-faint)]">
          Exact note values that moved the kit from{" "}
          <span className="text-accent">{otherLabel}</span> toward{" "}
          <span className="text-buff">{liveLabel}</span>
          {" · "}each row shows which patch
        </p>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto px-2.5 py-2">
        {patchOrder.map((ver) => {
          const group = byPatch.get(ver) ?? [];
          const dir = group[0]?.direction;
          return (
            <div key={ver}>
              <div className="mb-1 flex items-center gap-2">
                <span className="border border-border bg-[var(--ink)] px-1.5 py-0.5 font-data text-[10px] font-semibold tabular-nums text-accent">
                  {ver}
                </span>
                {dir && (
                  <span
                    className={cn(
                      "font-data text-[10px] uppercase",
                      dir === "buff" && "text-buff",
                      dir === "nerf" && "text-nerf",
                      dir !== "buff" && dir !== "nerf" && "text-adjust",
                    )}
                  >
                    {dir}
                  </span>
                )}
              </div>
              <ul className="space-y-1 border-l border-border pl-2">
                {group.map((line, i) => (
                  <li
                    key={`${line.patchId}-${line.abilityName}-${line.label}-${i}`}
                    className="font-data text-[11px]"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                      <span className="shrink-0 border border-border px-1 py-0.5 text-[10px] font-semibold text-fg">
                        {line.abilityKey === "BASE" || line.abilityKey === "?"
                          ? line.abilityKey === "BASE"
                            ? "BASE"
                            : "·"
                          : line.abilityKey}
                      </span>
                      <span className="text-muted">
                        {line.label}
                        {line.abilityName &&
                          line.label !== line.abilityName &&
                          line.abilityKey === "?" && (
                            <span className="text-[var(--fg-faint)]">
                              {" "}
                              ({line.abilityName})
                            </span>
                          )}
                      </span>
                    </div>
                    <div className="mt-0.5 pl-0.5 tabular-nums text-fg">
                      {line.before && (
                        <span className="text-muted/70 line-through">
                          {line.before}
                        </span>
                      )}
                      {line.before && line.after && (
                        <span className="mx-1 text-[var(--fg-faint)]">→</span>
                      )}
                      {line.after && (
                        <span className="font-semibold">{line.after}</span>
                      )}
                      {!line.before && !line.after && (
                        <span className="text-muted">see notes</span>
                      )}
                      <span className="ml-1.5 text-[9px] text-[var(--fg-faint)]">
                        · {line.patchVersion}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Compact note chips for one ability letter under its damage cell */
export function AbilityCompareNotes({
  abilityKey,
  lines,
}: {
  abilityKey: string;
  lines: CompareNoteLine[];
}) {
  const relevant = lines.filter((l) => {
    if (l.abilityKey === abilityKey) return true;
    // match by name letter from kit is handled by parent passing key
    return false;
  });
  // Also match ability name contains for Missile Barrage etc when key is ?
  // Parent should pass pre-filtered or we match QWER only on key

  if (!relevant.length) return null;

  return (
    <ul className="mt-1.5 space-y-1 border-t border-border/50 pt-1.5">
      {relevant.slice(0, 4).map((line, i) => (
        <li
          key={`${line.patchVersion}-${line.label}-${i}`}
          className="font-data text-[9px] leading-snug"
        >
          <span className="tabular-nums text-accent">{line.patchVersion}</span>
          <span className="text-[var(--fg-faint)]"> · </span>
          <span className="text-muted">{line.label}</span>
          <div className="tabular-nums text-fg/90">
            {line.before && (
              <span className="text-muted/60 line-through">{line.before}</span>
            )}
            {line.before && line.after && (
              <span className="mx-0.5 text-[var(--fg-faint)]">→</span>
            )}
            {line.after && <span className="font-medium">{line.after}</span>}
          </div>
        </li>
      ))}
      {relevant.length > 4 && (
        <li className="text-[9px] text-[var(--fg-faint)]">
          +{relevant.length - 4} more below
        </li>
      )}
    </ul>
  );
}
