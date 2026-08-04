import Link from "next/link";
import { getLatestPatch } from "@/data/patches";
import { WorldsCountdown } from "@/components/WorldsCountdown";

export const metadata = {
  title: "Worlds 2026 patch hub",
  description:
    "Follow every Summoner's Rift balance change on the road to Worlds 2026, with champion history and build damage comparisons.",
};

export default function WorldsPage() {
  const latest = getLatestPatch();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="border-b border-border pb-4">
        <p className="label-micro text-accent">Worlds 2026 · patch watch</p>
        <h1 className="mt-1 font-data text-3xl font-semibold tracking-tight text-fg">
          Road to Worlds
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          The 2026 World Championship runs <span className="text-fg">October 15–November 14</span>.
          RiftIntel tracks the balance path into the event without guessing which patch Riot will select.
        </p>
        <div className="mt-3 inline-flex border border-accent/40 bg-accent/10 px-3 py-2 font-data text-[12px] text-accent">
          <WorldsCountdown />
        </div>
      </header>

      <section className="grid gap-2 sm:grid-cols-3">
        <WorldsCard label="current patch" value={latest.version} href="/" />
        <WorldsCard label="starts" value="Oct 15" href="https://lolesports.com/en-US/news/msi-and-worlds-updates" external />
        <WorldsCard label="final" value="Nov 14" href="https://lolesports.com/en-US/news/msi-and-worlds-updates" external />
      </section>

      <section className="border border-adjust/35 bg-adjust/10 p-3">
        <h2 className="font-data text-[12px] font-semibold text-adjust">Tournament patch: not announced</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          RiftIntel will label the Worlds patch only after an official Riot or LoL Esports announcement. Until then, use the live patch timeline—not leaks—as the source of truth.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="label-micro">prepare your pool</h2>
        <ol className="space-y-2 text-[13px] text-muted">
          <li><span className="font-data text-accent">01</span> Save your champions in <Link href="/" className="text-fg hover:text-accent">My Champion Pool</Link>.</li>
          <li><span className="font-data text-accent">02</span> Review each champion&apos;s <Link href="/champions" className="text-fg hover:text-accent">quality-labeled balance timeline</Link>.</li>
          <li><span className="font-data text-accent">03</span> Test real spell rotations and builds in the <Link href="/calculator" className="text-fg hover:text-accent">damage calculator</Link>.</li>
          <li><span className="font-data text-accent">04</span> Return after every scheduled patch; the <a href="/feed.xml" className="text-fg hover:text-accent">RSS feed</a> updates automatically.</li>
        </ol>
      </section>

      <section className="border-t border-border pt-4">
        <h2 className="label-micro">official sources</h2>
        <div className="mt-2 flex flex-wrap gap-3 font-data text-[11px]">
          <a href="https://lolesports.com/en-US/news/msi-and-worlds-updates" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Worlds dates ↗</a>
          <a href="https://support-leagueoflegends.riotgames.com/hc/en-us/articles/360018987893-League-of-Legends-Patch-Schedule" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Riot patch schedule ↗</a>
          <a href="https://www.leagueoflegends.com/en-us/news/tags/patch-notes/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Official patch notes ↗</a>
        </div>
      </section>
    </div>
  );
}

function WorldsCard({ label, value, href, external = false }: { label: string; value: string; href: string; external?: boolean }) {
  const className = "border border-border bg-[var(--ink)]/40 p-3 transition hover:border-accent/50";
  const content = <><span className="label-hint block">{label}</span><span className="mt-1 block font-data text-xl font-semibold text-fg">{value}</span></>;
  return external ? <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a> : <Link href={href} className={className}>{content}</Link>;
}
