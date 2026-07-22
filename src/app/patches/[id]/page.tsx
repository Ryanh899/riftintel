import { notFound } from "next/navigation";
import { PatchExplorer } from "@/components/PatchExplorer";
import { PatchHero } from "@/components/PatchHero";
import { getAllPatchIds, getPatch } from "@/data/patches";

export function generateStaticParams() {
  return getAllPatchIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patch = getPatch(id);
  if (!patch) return { title: "Patch not found" };
  return {
    title: `Patch ${patch.version} — ${patch.title}`,
    description: patch.summary,
  };
}

export default async function PatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patch = getPatch(id);
  if (!patch) notFound();

  return (
    <div className="space-y-8">
      <PatchHero patch={patch} showBrowseAll />
      <PatchExplorer patch={patch} />
    </div>
  );
}
