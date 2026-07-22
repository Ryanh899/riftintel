import Link from "next/link";

export const metadata = {
  title: "Compare",
  description:
    "Same-build damage compare across patches lives on the damage calculator.",
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-8">
      <h1 className="font-data text-xl font-semibold text-fg">compare</h1>
      <p className="text-[13px] leading-relaxed text-muted">
        Use the <strong className="text-fg">damage calculator</strong>: set
        level, ranks, items, and runes as usual, then pick{" "}
        <span className="text-accent">vs patch</span> — only patches where that
        champion was balance-touched. Live damage and stats sit next to the same
        build on that older kit.
      </p>
      <Link
        href="/calculator"
        className="inline-block border border-accent/40 bg-accent/10 px-3 py-2 font-data text-[12px] text-accent hover:bg-accent/15"
      >
        open damage calculator →
      </Link>
    </div>
  );
}
