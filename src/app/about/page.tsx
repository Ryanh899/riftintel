import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { FEEDBACK_URL } from "@/lib/site";

export const metadata = {
  title: "About",
  description:
    "About RiftIntel — free League of Legends patch analysis, champion history, and damage calculator. Unofficial fan tool.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="border-b border-border pb-4">
        <BrandMark className="mb-4" size="lg" />
        <h1 className="font-data text-2xl font-semibold tracking-tight text-fg">
          about
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          <span className="text-fg">RiftIntel</span> is balance intelligence for
          League of Legends — patch notes you can scan, real numbers, champion
          history, and a live-patch damage calculator. Built for everyday
          players, not walls of fluff.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="label-micro">brand</h2>
        <ul className="space-y-1.5 font-data text-[12px] text-muted">
          <li>
            <span className="text-fg">Rift</span> — the map, the game
          </li>
          <li>
            <span className="text-accent">Intel</span> — signal, clarity, analysis
          </li>
          <li>
            Mark — scan node (center) + compass ticks (orientation) + teal
            blips (signal)
          </li>
        </ul>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Swatch hex="#05070c" label="void" />
          <Swatch hex="#4f8cff" label="intel" />
          <Swatch hex="#5eead4" label="signal" />
          <Swatch hex="#e8edf7" label="fg" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Swatch hex="#2ee59d" label="buff" />
          <Swatch hex="#ff5c6a" label="nerf" />
          <Swatch hex="#f0b429" label="adj" />
          <Swatch hex="#b57bff" label="rework" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="label-micro">what you get</h2>
        <ul className="space-y-1.5 text-[13px] text-fg/90">
          <li>
            <Link href="/" className="text-accent hover:underline">
              Latest patch
            </Link>{" "}
            — overview, filters, TL;DRs + numbers
          </li>
          <li>
            <Link href="/patches" className="text-accent hover:underline">
              All patches
            </Link>{" "}
            — full balance history
          </li>
          <li>
            <Link href="/champions" className="text-accent hover:underline">
              Champs
            </Link>{" "}
            — per-champion timelines
          </li>
          <li>
            <Link href="/calculator" className="text-accent hover:underline">
              Dmg
            </Link>{" "}
            — ability damage by build, ranks, pen
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="label-micro">feedback</h2>
        <p className="text-[12px] leading-relaxed text-muted">
          Found a wrong number, broken UI, or have an idea?{" "}
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Open a GitHub issue →
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="label-micro">legal</h2>
        <p className="text-[12px] leading-relaxed text-muted">
          Unofficial fan-made tool. Not endorsed by or affiliated with Riot
          Games. League of Legends and Riot Games are trademarks or registered
          trademarks of Riot Games, Inc.
        </p>
      </section>
    </div>
  );
}

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex items-center gap-2 border border-border px-2 py-1.5">
      <span
        className="h-4 w-4 shrink-0 border border-border"
        style={{ background: hex }}
        aria-hidden
      />
      <span className="font-data text-[10px] text-muted">
        <span className="text-fg">{label}</span>{" "}
        <span className="text-[var(--fg-faint)]">{hex}</span>
      </span>
    </div>
  );
}
