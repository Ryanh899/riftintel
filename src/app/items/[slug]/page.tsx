import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangeCard } from "@/components/ChangeCard";
import { DirectionBadge } from "@/components/DirectionBadge";
import { getAllPatches, getItemHistory } from "@/data/patches";
import {
  cn,
  directionSolid,
  formatDate,
  itemImage,
  slugify,
} from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { DataQualityNotice } from "@/components/DataQualityNotice";

export function generateStaticParams() {
  const slugs = new Set<string>();
  for (const p of getAllPatches()) {
    for (const item of p.items) {
      slugs.add(item.id || slugify(item.name));
    }
  }
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const history = getItemHistory(slug);
  if (!history) return { title: "Item not found" };
  return {
    title: `${history.name} item history`,
    description: `Item balance changes for ${history.name} across patches.`,
  };
}

export default async function ItemHistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const history = getItemHistory(slug);
  if (!history) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/patches"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to patches
      </Link>

      <header className="flex flex-wrap items-start gap-4">
        {history.assetKey && itemImage(history.assetKey) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={itemImage(history.assetKey)!}
            alt=""
            width={64}
            height={64}
            className="rounded-xl ring-1 ring-border"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-fg">{history.name}</h1>
          <p className="mt-1 text-sm text-muted">
            Item balance history · {history.entries.length} change
            {history.entries.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      <DataQualityNotice quality="archive-review" history />

      <section className="rounded-2xl border border-border bg-surface/40 p-4">
        <div className="flex flex-wrap gap-2">
          {history.entries.map((entry) => (
            <div
              key={entry.patchId}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-bg/50 px-3 py-2"
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  directionSolid(entry.change.direction).split(" ")[0],
                )}
              />
              <span className="text-xs font-bold">{entry.version}</span>
              <DirectionBadge direction={entry.change.direction} size="sm" />
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        {[...history.entries].reverse().map((entry) => (
          <section key={entry.patchId}>
            <div className="mb-3 flex items-center gap-2">
              <Link
                href={`/patches/${entry.patchId}`}
                className="text-sm font-semibold text-accent hover:underline"
              >
                Patch {entry.version}
              </Link>
              <span className="text-xs text-muted">
                {formatDate(entry.releaseDate)}
              </span>
            </div>
            <ChangeCard
              entity={entry.change}
              patchId={entry.patchId}
              showHistoryLink={false}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
