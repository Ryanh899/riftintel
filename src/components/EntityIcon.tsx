"use client";

import { useState } from "react";
import type { EntityChange } from "@/lib/types";
import { entityImageCandidates } from "@/lib/assets";
import { cn } from "@/lib/utils";

export function EntityIcon({
  entity,
  size = 40,
  className,
}: {
  entity: Pick<EntityChange, "type" | "name" | "assetKey" | "direction">;
  size?: number;
  className?: string;
}) {
  const entityKey = `${entity.type}:${entity.name}:${entity.assetKey ?? ""}`;
  return (
    <EntityIconInner
      key={entityKey}
      entity={entity}
      size={size}
      className={className}
    />
  );
}

function EntityIconInner({
  entity,
  size,
  className,
}: {
  entity: Pick<EntityChange, "type" | "name" | "assetKey" | "direction">;
  size: number;
  className?: string;
}) {
  const candidates = entityImageCandidates(
    entity.type,
    entity.name,
    entity.assetKey,
  );
  const [idx, setIdx] = useState(0);
  const src = candidates[idx] ?? null;

  const initials = entity.name
    .split(/[\s&/]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-[var(--ink)] ring-1 ring-border",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => {
            setIdx((i) => i + 1);
          }}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-bold uppercase text-muted"
          style={{ fontSize: Math.max(10, size * 0.28) }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export function ChampionPortrait({
  name,
  assetKey,
  size = 48,
  className,
}: {
  name: string;
  assetKey?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <EntityIcon
      entity={{ type: "champion", name, assetKey, direction: "adjust" }}
      size={size}
      className={className}
    />
  );
}
