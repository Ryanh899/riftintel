import { getChampionIndex } from "@/data/patches";
import ChampionsClient from "./ChampionsClient";

export const metadata = {
  title: "Champions",
};

export default function ChampionsPage() {
  const champs = getChampionIndex();
  return <ChampionsClient champs={champs} />;
}
