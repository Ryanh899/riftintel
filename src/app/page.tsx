import { PatchExplorer } from "@/components/PatchExplorer";
import { PatchHero } from "@/components/PatchHero";
import { getLatestPatch, getPatchIndex } from "@/data/patches";
import Link from "next/link";

export default function HomePage() {
  const patch = getLatestPatch();
  const recent = getPatchIndex().slice(0, 8);

  return (
    <div className="space-y-5">
      <PatchHero patch={patch} />

      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 border-b border-border pb-3">
        <span className="label-micro mr-2">recent</span>
        {recent.map((p) => (
          <Link
            key={p.id}
            href={p.id === patch.id ? "/" : `/patches/${p.id}`}
            className={`font-data px-1.5 py-0.5 text-[12px] tabular-nums ${
              p.id === patch.id
                ? "text-accent underline underline-offset-4"
                : "text-[var(--fg-faint)] hover:text-fg"
            }`}
          >
            {p.version}
          </Link>
        ))}
      </div>

      <PatchExplorer patch={patch} />
    </div>
  );
}
