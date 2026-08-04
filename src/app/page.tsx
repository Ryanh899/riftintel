import { PatchExplorer } from "@/components/PatchExplorer";
import { PatchHero } from "@/components/PatchHero";
import { getChampionIndex, getLatestPatch, getPatchIndex } from "@/data/patches";
import Link from "next/link";
import { ChampionPool } from "@/components/ChampionPool";
import { FeedbackPrompt } from "@/components/FeedbackPrompt";

export default function HomePage() {
  const patch = getLatestPatch();
  const recent = getPatchIndex().slice(0, 8);
  const champions = getChampionIndex();

  return (
    <div className="space-y-5">
      <PatchHero patch={patch} />

      <ChampionPool
        champions={champions}
        changed={patch.champions}
        patchVersion={patch.version}
      />

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
      <FeedbackPrompt context={`patch_${patch.version}`} />
    </div>
  );
}
