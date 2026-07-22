"use client";

import type { EntityChange } from "@/lib/types";
import { scrollToId } from "@/lib/scroll";
import { cn, entityAnchorId } from "@/lib/utils";
import { EntityIcon } from "./EntityIcon";
import { ChangePreview } from "./ChangePreview";
import { HoverCard } from "./HoverCard";
import { DirectionDot } from "./DirectionBadge";

function scrollToEntity(entity: EntityChange) {
  scrollToId(entityAnchorId(entity));
}

export function OverviewBoard({
  champions,
  items,
  systems,
}: {
  champions: EntityChange[];
  items: EntityChange[];
  systems: EntityChange[];
}) {
  const groups: { key: string; label: string; entities: EntityChange[] }[] = [
    { key: "c", label: "champions", entities: champions },
    { key: "i", label: "items", entities: items },
    { key: "s", label: "systems", entities: systems },
  ].filter((g) => g.entities.length > 0);

  if (!groups.length) return null;

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="label-micro">
              {group.label}
              <span className="label-hint ml-2">{group.entities.length}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {group.entities.map((entity) => (
              <HoverCard
                key={entityAnchorId(entity)}
                content={<ChangePreview entity={entity} />}
              >
                <button
                  type="button"
                  onClick={() => scrollToEntity(entity)}
                  className={cn(
                    "group relative flex items-center gap-1.5 border border-transparent bg-panel/0 px-1 py-1 transition",
                    "hover:border-[var(--line-strong)] hover:bg-[var(--ink)]",
                    "focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent",
                  )}
                >
                  <EntityIcon entity={entity} size={36} className="!rounded-none" />
                  <span className="hidden max-w-[72px] truncate text-left text-[11px] text-fg/90 sm:inline">
                    {entity.name}
                  </span>
                  <DirectionDot
                    direction={entity.direction}
                    className="absolute right-0.5 top-0.5 sm:static"
                  />
                </button>
              </HoverCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
