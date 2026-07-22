"use client";

import { useMemo, useState } from "react";
import type { Patch } from "@/lib/types";
import { allEntities, cn, slugify } from "@/lib/utils";
import { EntityIcon } from "./EntityIcon";
import { DirectionBadge } from "./DirectionBadge";
import Link from "next/link";

export function CompareClient({ patches }: { patches: Patch[] }) {
  const [leftId, setLeftId] = useState(patches[1]?.id ?? patches[0]?.id);
  const [rightId, setRightId] = useState(patches[0]?.id);

  const left = patches.find((p) => p.id === leftId);
  const right = patches.find((p) => p.id === rightId);

  const comparison = useMemo(() => {
    if (!left || !right) return [];
    const leftMap = new Map(
      allEntities(left).map((e) => [slugify(e.name), e]),
    );
    const rightMap = new Map(
      allEntities(right).map((e) => [slugify(e.name), e]),
    );
    const keys = new Set([...leftMap.keys(), ...rightMap.keys()]);
    return Array.from(keys)
      .map((key) => ({
        key,
        left: leftMap.get(key),
        right: rightMap.get(key),
      }))
      .filter((row) => row.left || row.right)
      .sort((a, b) => {
        const an = a.left?.name ?? a.right?.name ?? "";
        const bn = b.left?.name ?? b.right?.name ?? "";
        return an.localeCompare(bn);
      });
  }, [left, right]);

  const both = comparison.filter((r) => r.left && r.right);
  const onlyLeft = comparison.filter((r) => r.left && !r.right);
  const onlyRight = comparison.filter((r) => r.right && !r.left);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <PatchSelect
          label="Older / baseline"
          value={leftId}
          onChange={setLeftId}
          patches={patches}
        />
        <PatchSelect
          label="Newer / compare to"
          value={rightId}
          onChange={setRightId}
          patches={patches}
        />
      </div>

      {left && right && left.id === right.id && (
        <p className="rounded-xl border border-adjust/30 bg-adjust/10 px-4 py-3 text-sm text-adjust">
          Pick two different patches to see what moved between them.
        </p>
      )}

      {left && right && left.id !== right.id && (
        <>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="rounded-full bg-surface-2 px-3 py-1 text-muted">
              Changed in both:{" "}
              <strong className="text-fg">{both.length}</strong>
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-muted">
              Only in {left.version}:{" "}
              <strong className="text-fg">{onlyLeft.length}</strong>
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-muted">
              Only in {right.version}:{" "}
              <strong className="text-fg">{onlyRight.length}</strong>
            </span>
          </div>

          {both.length > 0 && (
            <Section title={`Touched in both ${left.version} & ${right.version}`}>
              <div className="space-y-2">
                {both.map((row) => (
                  <CompareRow
                    key={row.key}
                    leftVersion={left.version}
                    rightVersion={right.version}
                    left={row.left!}
                    right={row.right!}
                  />
                ))}
              </div>
            </Section>
          )}

          {onlyRight.length > 0 && (
            <Section title={`New to ${right.version}`}>
              <div className="grid gap-2 sm:grid-cols-2">
                {onlyRight.map((row) => (
                  <MiniCard
                    key={row.key}
                    entity={row.right!}
                    version={right.version}
                  />
                ))}
              </div>
            </Section>
          )}

          {onlyLeft.length > 0 && (
            <Section title={`Only in ${left.version} (not in ${right.version})`}>
              <div className="grid gap-2 sm:grid-cols-2">
                {onlyLeft.map((row) => (
                  <MiniCard
                    key={row.key}
                    entity={row.left!}
                    version={left.version}
                  />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function PatchSelect({
  label,
  value,
  onChange,
  patches,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  patches: Patch[];
}) {
  return (
    <label className="block rounded-2xl border border-border bg-surface/40 p-4">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-medium text-fg outline-none focus:border-accent/50"
      >
        {patches.map((p) => (
          <option key={p.id} value={p.id}>
            {p.version} — {p.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-fg">{title}</h2>
      {children}
    </section>
  );
}

function CompareRow({
  left,
  right,
  leftVersion,
  rightVersion,
}: {
  left: NonNullable<ReturnType<typeof allEntities>[number]>;
  right: NonNullable<ReturnType<typeof allEntities>[number]>;
  leftVersion: string;
  rightVersion: string;
}) {
  const href =
    left.type === "champion"
      ? `/champions/${slugify(left.name)}`
      : left.type === "item"
        ? `/items/${slugify(left.name)}`
        : undefined;

  const inner = (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface/30 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div className="flex items-start gap-3">
        <EntityIcon entity={left} size={40} />
        <div className="min-w-0">
          <div className="font-semibold text-fg">{left.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-muted">{leftVersion}</span>
            <DirectionBadge direction={left.direction} size="sm" />
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs text-muted">{left.tldr}</p>
        </div>
      </div>
      <div className="hidden text-center text-xs font-medium text-muted sm:block">
        vs
      </div>
      <div className="flex items-start gap-3 sm:justify-end sm:text-right">
        <div className="min-w-0 sm:order-1">
          <div className="font-semibold text-fg sm:hidden">{right.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:justify-end">
            <span className="text-[10px] text-muted">{rightVersion}</span>
            <DirectionBadge direction={right.direction} size="sm" />
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs text-muted">{right.tldr}</p>
        </div>
        <EntityIcon entity={right} size={40} className="sm:order-2" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:opacity-95">
        {inner}
      </Link>
    );
  }
  return inner;
}

function MiniCard({
  entity,
  version,
}: {
  entity: NonNullable<ReturnType<typeof allEntities>[number]>;
  version: string;
}) {
  const href =
    entity.type === "champion"
      ? `/champions/${slugify(entity.name)}`
      : entity.type === "item"
        ? `/items/${slugify(entity.name)}`
        : `/patches/${version}`;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-surface/30 p-3 transition hover:border-accent/30",
      )}
    >
      <EntityIcon entity={entity} size={36} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-fg">{entity.name}</span>
          <DirectionBadge direction={entity.direction} size="sm" />
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted">{entity.tldr}</p>
      </div>
    </Link>
  );
}
