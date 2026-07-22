import Link from "next/link";
import { BrandWordmark } from "./BrandMark";
import { FEEDBACK_URL } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-5">
        <p className="font-data text-[10px] text-[var(--fg-faint)]">
          <BrandWordmark className="text-[10px]" /> · unofficial · not riot
        </p>
        <div className="flex flex-wrap gap-3 font-data text-[10px] text-[var(--fg-faint)]">
          <Link href="/about" className="hover:text-muted">
            about
          </Link>
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
