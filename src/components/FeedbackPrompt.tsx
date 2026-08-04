"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { FEEDBACK_URL } from "@/lib/site";

export function FeedbackPrompt({ context }: { context: string }) {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);

  const respond = (next: "yes" | "no") => {
    setAnswer(next);
    trackEvent("feedback_response", { context, useful: next === "yes" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border py-3 font-data text-[11px]">
      <span className="text-muted">
        {answer ? "Thanks — this helps prioritize fixes." : "Was this useful?"}
      </span>
      {!answer && (
        <>
          <button
            type="button"
            onClick={() => respond("yes")}
            className="border border-border px-2 py-1 text-fg hover:border-buff/60 hover:text-buff"
          >
            yes
          </button>
          <button
            type="button"
            onClick={() => respond("no")}
            className="border border-border px-2 py-1 text-fg hover:border-nerf/60 hover:text-nerf"
          >
            no
          </button>
        </>
      )}
      <a
        href={FEEDBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("feedback_detail_opened", { context })}
        className="text-[var(--fg-faint)] hover:text-accent"
      >
        report a wrong number ↗
      </a>
    </div>
  );
}
