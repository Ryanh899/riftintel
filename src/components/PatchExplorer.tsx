"use client";

import { useMemo, useState } from "react";
import type {
  FilterDirection,
  FilterRole,
  FilterType,
  Patch,
} from "@/lib/types";
import { scrollToId } from "@/lib/scroll";
import { allEntities, cn, entityAnchorId, filterEntities } from "@/lib/utils";
import { OverviewBoard } from "./OverviewBoard";
import { ChangeCard } from "./ChangeCard";
import { EntityIcon } from "./EntityIcon";
import { ChangePreview } from "./ChangePreview";
import { HoverCard } from "./HoverCard";
import { DirectionDot } from "./DirectionBadge";

const directions: { value: FilterDirection; label: string }[] = [
  { value: "all", label: "all" },
  { value: "buff", label: "buff" },
  { value: "nerf", label: "nerf" },
  { value: "adjust", label: "adj" },
];

const types: { value: FilterType; label: string }[] = [
  { value: "all", label: "all" },
  { value: "champion", label: "champ" },
  { value: "item", label: "item" },
  { value: "system", label: "sys" },
];

const roles: { value: FilterRole; label: string }[] = [
  { value: "all", label: "role" },
  { value: "top", label: "top" },
  { value: "jungle", label: "jg" },
  { value: "mid", label: "mid" },
  { value: "bot", label: "bot" },
  { value: "support", label: "sup" },
];

export function PatchExplorer({ patch }: { patch: Patch }) {
  const [direction, setDirection] = useState<FilterDirection>("all");
  const [role, setRole] = useState<FilterRole>("all");
  const [type, setType] = useState<FilterType>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      filterEntities(allEntities(patch), { direction, role, type, query }),
    [patch, direction, role, type, query],
  );

  const hasFilters =
    direction !== "all" || role !== "all" || type !== "all" || query.trim();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_160px]">
      <div className="min-w-0 space-y-5">
        {/* Step 1: scan */}
        <section>
          <p className="label-micro mb-2">
            1 · scan
            <span className="label-hint ml-2">hover preview · click jump</span>
          </p>
          <OverviewBoard
            champions={
              type === "all" || type === "champion"
                ? filterEntities(patch.champions, { direction, role, query })
                : []
            }
            items={
              type === "all" || type === "item"
                ? filterEntities(patch.items, { direction, query })
                : []
            }
            systems={
              type === "all" || type === "system"
                ? filterEntities(patch.systems, { direction, query })
                : []
            }
          />
        </section>

        {/* Step 2: filter */}
        <section
          data-scroll-sticky
          className="sticky top-11 z-30 -mx-1 border-y border-border bg-bg/95 px-1 py-2 backdrop-blur-sm"
        >
          <p className="label-micro mb-1.5">
            2 · filter
            <span className="label-hint ml-2">
              {filtered.length}/{allEntities(patch).length}
            </span>
          </p>
          <div className="flex items-center gap-x-3 gap-y-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="name…"
              className="w-28 shrink-0 border-0 border-b border-border bg-transparent py-0.5 font-data text-[12px] text-fg outline-none placeholder:text-[var(--fg-faint)] focus:border-accent sm:w-36"
            />
            <FilterGroup
              options={directions}
              value={direction}
              onChange={setDirection}
              tone
            />
            <FilterGroup options={types} value={type} onChange={setType} />
            <FilterGroup options={roles} value={role} onChange={setRole} />
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setDirection("all");
                  setRole("all");
                  setType("all");
                  setQuery("");
                }}
                className="font-data text-[11px] text-muted hover:text-fg"
              >
                clear
              </button>
            )}
          </div>
        </section>

        {/* Step 3: numbers first, prose under each card */}
        <section>
          <p className="label-micro mb-1">
            3 · numbers
            <span className="label-hint ml-2">ability · values · then text</span>
          </p>
          {filtered.length === 0 ? (
            <p className="py-8 font-data text-[12px] text-muted">no matches</p>
          ) : (
            <div>
              {filtered.map((entity) => (
                <ChangeCard
                  key={entityAnchorId(entity)}
                  entity={entity}
                  patchId={patch.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Index rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-14 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <p className="label-micro mb-2">index</p>
          <ul className="space-y-0">
            {filtered.map((entity) => (
              <li key={entityAnchorId(entity)}>
                <HoverCard
                  content={
                    <ChangePreview
                      entity={entity}
                      patchVersion={patch.version}
                    />
                  }
                >
                  <a
                    href={`#${entityAnchorId(entity)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToId(entityAnchorId(entity));
                    }}
                    className="flex items-center gap-1.5 py-1 hover:bg-[var(--ink)]"
                  >
                    <EntityIcon
                      entity={entity}
                      size={18}
                      className="!rounded-none"
                    />
                    <span className="min-w-0 flex-1 truncate font-data text-[11px] text-fg/90">
                      {entity.name}
                    </span>
                    <DirectionDot direction={entity.direction} />
                  </a>
                </HoverCard>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function FilterGroup<T extends string>({
  options,
  value,
  onChange,
  tone,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  tone?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {options.map((o) => {
        const active = value === o.value;
        const color =
          tone && o.value === "buff"
            ? "text-buff"
            : tone && o.value === "nerf"
              ? "text-nerf"
              : tone && o.value === "adjust"
                ? "text-adjust"
                : active
                  ? "text-fg"
                  : "text-[var(--fg-faint)]";
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "px-1.5 py-0.5 font-data text-[11px] transition",
              color,
              active && "underline decoration-1 underline-offset-4",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
