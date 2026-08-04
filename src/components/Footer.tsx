import Link from "next/link";
import { BrandWordmark } from "./BrandMark";
import { FEEDBACK_URL } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-start justify-between gap-3 px-3 py-3 sm:px-5">
        <p className="max-w-3xl font-data text-[10px] leading-relaxed text-[var(--fg-faint)]">
          <BrandWordmark className="text-[10px]" /> is not endorsed by Riot
          Games and does not reflect the views or opinions of Riot Games or
          anyone officially involved in producing or managing Riot Games
          properties. Riot Games and all associated properties are trademarks
          or registered trademarks of Riot Games, Inc.
        </p>
        <div className="flex flex-wrap gap-3 font-data text-[10px] text-[var(--fg-faint)]">
          <Link href="/about" className="hover:text-muted">
            about
          </Link>
          <Link href="/privacy" className="hover:text-muted">
            privacy
          </Link>
          <Link href="/terms" className="hover:text-muted">
            terms
          </Link>
          <a href="/feed.xml" className="hover:text-muted">
            rss
          </a>
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted"
          >
            feedback
          </a>
          <a
            href="https://github.com/Ryanh899/riftintel"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted"
          >
            github
          </a>
        </div>
      </div>
    </footer>
  );
}
