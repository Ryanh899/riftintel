import type { DataQuality } from "@/lib/types";

export function DataQualityNotice({
  quality,
  sourceUrl,
  history = false,
}: {
  quality: DataQuality;
  sourceUrl?: string;
  history?: boolean;
}) {
  if (quality === "verified" && !history) {
    return (
      <span className="inline-flex items-center border border-buff/30 bg-buff/10 px-1.5 py-0.5 font-data text-[9px] uppercase tracking-wide text-buff">
        publication checks passed
      </span>
    );
  }

  return (
    <div className="border-l-2 border-adjust bg-adjust/10 px-3 py-2 font-data text-[11px] leading-relaxed text-muted">
      <strong className="font-semibold text-adjust">archive under review</strong>
      <span className="text-[var(--fg-faint)]"> · </span>
      {history
        ? "Older entries are useful for discovery, but some imported values and summaries have not passed the current publication checks. Confirm exact numbers in the linked patch source before relying on them."
        : "This imported patch predates the current publication checks. Use it for discovery, not exact calculations, until verification is complete."}
      {sourceUrl && (
        <>
          {" "}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Check source ↗
          </a>
        </>
      )}
    </div>
  );
}
