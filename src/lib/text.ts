/** Clean noisy ingested text for display */

export function cleanSummary(text: string | undefined | null, max = 220): string {
  if (!text) return "";
  let t = text
    .replace(/^Here is a summary[^.]*\.\s*/i, "")
    .replace(/\*\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.startsWith("*") || t.startsWith("-")) {
    t = t.replace(/^[\*\-]\s*/, "");
  }
  if (t.length > max) t = t.slice(0, max - 1).trimEnd() + "…";
  return t;
}

export function cleanTldr(text: string | undefined | null, max = 180): string {
  if (!text) return "";
  let t = text
    // legacy placeholders (should be gone after re-ingest)
    .replace(/\[scaled values?\]/gi, "level-scaled")
    .replace(/\s*;\s*/g, " · ")
    .replace(/\s+/g, " ")
    .trim();
  // Collapse "level-scaled from level-scaled"
  t = t.replace(/level-scaled from level-scaled/gi, "level-scaled values changed");
  if (t.length > max) t = t.slice(0, max - 1).trimEnd() + "…";
  return t;
}

export function shortPatchTitle(version: string, title: string): string {
  if (!title || title === `Patch ${version}` || title.startsWith("Patch ")) {
    return version;
  }
  if (title.startsWith("|") || title.length > 60) return version;
  return title;
}
