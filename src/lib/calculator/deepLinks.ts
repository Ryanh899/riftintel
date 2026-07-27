export type ChampionLinkEntry = {
  id: string;
  name: string;
};

export type HistoryLinkEntry = {
  patchId: string;
  version: string;
};

export type CompareLinkResolution = {
  patchId: string | null;
  error: string | null;
};

function normalizeChampion(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveChampionLink(
  query: string | null | undefined,
  champions: ChampionLinkEntry[],
  fallback = "Ahri",
): string {
  if (!query?.trim()) return fallback;
  const normalized = normalizeChampion(query);
  const match = champions.find(
    (champion) =>
      normalizeChampion(champion.id) === normalized ||
      normalizeChampion(champion.name) === normalized,
  );
  return match?.id ?? query.trim();
}

export function resolveCompareLink(
  compare: string | null | undefined,
  from: string | null | undefined,
  entries: HistoryLinkEntry[],
): CompareLinkResolution {
  if (!compare) return { patchId: null, error: null };
  if (!entries.length) {
    return {
      patchId: null,
      error: "No verified balance history is available for this champion.",
    };
  }

  const newest = entries[entries.length - 1]!;
  if (compare === "last") {
    return { patchId: newest.patchId, error: null };
  }

  if (compare === "before") {
    if (!from) {
      return {
        patchId: null,
        error: "This comparison link is missing its source patch.",
      };
    }
    const fromIndex = entries.findIndex(
      (entry) => entry.patchId === from || entry.version === from,
    );
    if (fromIndex < 0) {
      return {
        patchId: null,
        error: `Patch ${from} is not in this champion's balance history.`,
      };
    }
    if (fromIndex === 0) {
      return {
        patchId: null,
        error: `The dataset does not contain a verified kit from before patch ${from}.`,
      };
    }
    return { patchId: entries[fromIndex - 1]!.patchId, error: null };
  }

  const exact = entries.find(
    (entry) => entry.patchId === compare || entry.version === compare,
  );
  if (!exact) {
    return {
      patchId: null,
      error: `Patch ${compare} is not in this champion's balance history.`,
    };
  }
  return { patchId: exact.patchId, error: null };
}
