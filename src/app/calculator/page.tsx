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
    <DamageCalculator version={version} champions={champions} items={items} />
  );
}
