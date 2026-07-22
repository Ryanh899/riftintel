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
    "League of Legends build damage calculator — same build compare vs an older patch where this champion was changed.",
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
