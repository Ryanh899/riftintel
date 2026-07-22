/**
 * Public data API for the app.
 * Prefers ingested JSON under by-id/ + champions/; falls back to sample TS patches.
 */
export {
  getAllPatchIds,
  getAllPatches,
  getChampionHistory,
  getChampionIndex,
  getItemHistory,
  getLatestPatch,
  getManifest,
  getPatch,
  getPatchIndex,
} from "./loader";

import { getAllPatches as _getAllPatches } from "./loader";

/** @deprecated use getAllPatches — kept for generateStaticParams convenience */
export function patches() {
  return _getAllPatches();
}
