export const metadata = {
  title: "Privacy",
  description: "How RiftIntel handles analytics, local preferences, and third-party game data.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 text-[13px] leading-relaxed text-muted">
      <header className="border-b border-border pb-4">
        <h1 className="font-data text-2xl font-semibold text-fg">privacy</h1>
        <p className="mt-1 font-data text-[11px] text-[var(--fg-faint)]">Effective August 4, 2026</p>
      </header>
      <Section title="What RiftIntel stores">
        RiftIntel has no user accounts or production database. Your champion pool is stored in your browser&apos;s local storage and does not leave your device. Clearing site data removes it.
      </Section>
      <Section title="Analytics">
        The site uses Vercel Web Analytics to measure page views and low-cardinality product actions such as selecting a champion, sharing a result, or answering whether a page was useful. Optional Google Analytics may be enabled by the operator. Do not enter personal information into feedback events; the product does not intentionally collect names, email addresses, or in-game account identifiers.
      </Section>
      <Section title="Third-party requests">
        Champion and item images may load from Riot Data Dragon or CommunityDragon, so those providers can receive ordinary web request information such as IP address and browser headers under their own policies. Calculator data sourced from Riot and Meraki Analytics is packaged during the production build and served by RiftIntel. Feedback and source links open external sites only when you choose them.
      </Section>
      <Section title="Advertising and sales">
        The current public beta does not run targeted advertising or sell personal information. This notice will be updated before adding advertising, accounts, payments, or new persistent identifiers.
      </Section>
      <Section title="Contact">
        Privacy and data-quality questions can be filed through the public feedback link in the site footer.
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="label-micro mb-1.5">{title}</h2><p>{children}</p></section>;
}
