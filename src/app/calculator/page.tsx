import { Suspense } from "react";
import { DamageCalculator } from "@/components/calculator/DamageCalculator";
import {
  fetchChampionList,
  fetchItems,
  getLatestDdragonVersion,
} from "@/lib/calculator/data";

export const revalidate = 3600;

export const metadata = {
  title: "Damage calculator",
  description:
    "See what a balance change actually does to your kit — live damage with items, ranks, runes, and compare vs a prior patch.",
};

export default async function CalculatorPage() {
  const version = await getLatestDdragonVersion();
  const [champions, items] = await Promise.all([
    fetchChampionList(version),
    fetchItems(version),
  ]);

  return (
    <Suspense
      fallback={
        <p className="py-12 text-center font-data text-[13px] text-muted">
          loading calculator…
        </p>
      }
    >
      <DamageCalculator version={version} champions={champions} items={items} />
    </Suspense>
  );
}
