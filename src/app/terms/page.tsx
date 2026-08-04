export const metadata = {
  title: "Terms and disclaimers",
  description: "RiftIntel terms, calculation limitations, and Riot Games fan-product disclaimer.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 text-[13px] leading-relaxed text-muted">
      <header className="border-b border-border pb-4">
        <h1 className="font-data text-2xl font-semibold text-fg">terms & disclaimers</h1>
        <p className="mt-1 font-data text-[11px] text-[var(--fg-faint)]">Effective August 4, 2026</p>
      </header>
      <Section title="Unofficial fan product">
        RiftIntel is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
      </Section>
      <Section title="Informational estimates">
        Patch summaries and calculator results are educational estimates. Spell scripts, undocumented interactions, live hotfixes, rounding, conditional effects, game modes, and source-data errors can make in-game results differ. Confidence labels and archive-review warnings are part of the result and must not be removed from shared interpretations.
      </Section>
      <Section title="Acceptable use">
        You may use the site for personal study, discussion, and gameplay preparation. Do not use it to misrepresent affiliation with Riot, scrape the service in a way that disrupts availability, bypass access controls, or republish the product as your own.
      </Section>
      <Section title="Availability">
        The beta is provided as available without a promise of uninterrupted service. Cost-protection limits may intentionally pause the site during exceptional traffic rather than create unbounded operator charges.
      </Section>
      <Section title="Changes">
        Features and these terms may change as the product moves from free validation to a registered commercial offering. Material privacy or monetization changes will be posted here before they take effect.
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="label-micro mb-1.5">{title}</h2><p>{children}</p></section>;
}
