# Cost, security, compliance, SEO, and analytics

Last reviewed: August 4, 2026.

## Non-negotiable cost rule

RiftIntel must never depend on an uncapped metered service. Do not attach a
payment method, enable an add-on, or upgrade a hosting plan without recording
the fixed cost, every metered resource, its hard-stop behavior, who checks
usage, and the shutdown procedure.

There are no paid APIs in the current application. Patch data is stored in Git,
game assets come from community/Riot CDNs, and optional AI enrichment runs
locally with Ollama.

## Hosting stages

### Stage A — free, noncommercial validation

Vercel Hobby can host a personal, noncommercial beta. Current Vercel
documentation says Hobby is restricted to noncommercial personal use. Hobby
does **not** include Spend Management; it is paused when included limits are
exceeded.

- Do not enable advertising, subscriptions, sponsorship sales, or paid access.
- Do not add a payment method for usage-based products.
- Check the Vercel Usage page after launch posts and on patch days.
- Treat a quota pause as the intended hard stop.

Official references:

- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
- [Vercel account plans](https://vercel.com/docs/plans)
- [Vercel Spend Management](https://vercel.com/docs/spend-management)

### Stage B — before any monetization

Choose and document one of these paths:

1. **Static-first Cloudflare Pages/Workers Free.** Prefer static JSON and assets;
   avoid Pages Functions for ordinary visits. Current free limits include 500
   Pages builds per month, 20,000 files, and a 100,000-request daily Workers
   limit. Reconfirm the terms and limits immediately before migration.
2. **Vercel Pro.** Accept the fixed subscription, enable Spend Management, and
   enable automatic production pausing. Spend Management does not cover seats,
   integrations, or separate add-ons, so audit those independently.

Official references:

- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)

Do not monetize first and migrate later.

## Zero-surprise-charge checklist

- [ ] No hosted LLM or per-visitor AI request.
- [ ] No production database until cross-device accounts are proven necessary.
- [ ] No paid image transformation; use correctly sized/versioned CDN assets.
- [ ] No paid analytics plan or marketplace integration.
- [ ] Automated builds run only for meaningful changes.
- [ ] Usage alerts are enabled wherever the platform supports them.
- [ ] A traffic spike results in throttling/pausing, not an open-ended invoice.
- [ ] Hosting terms are rechecked before enabling revenue.

## Riot compliance before revenue

Before advertising, subscriptions, donations, crowdfunding, or sponsorship:

1. Read the current [League Developer Policy](https://developer.riotgames.com/docs/lol)
   and [Riot Legal Jibber Jabber](https://www.riotgames.com/en/legal).
2. Register the product through the Riot Developer Portal when required.
3. Obtain an Approved or Acknowledged product status before monetization where
   the League policy requires it.
4. Keep a meaningful free tier.
5. Charge only for transformative workflow features, never raw Riot facts.
6. Preserve the required Riot notice in the product.
7. Recheck policy before every new revenue model.

This checklist is operational guidance, not legal advice.

## Data safety

New ingests pass `scripts/ingest/validate_patch.py` before publication.
Malformed patches are written under `src/data/patches/quarantine/` and are not
loaded by the application.

```bash
npm run data:audit
npm run test:ingest
npm run verify
```

Never bypass the quality gate to publish on patch day.

## Security baseline

- HTTPS from the hosting provider.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- Strict referrer and permissions policies.
- `poweredByHeader: false`.
- No secrets required for core application behavior.
- GitHub workflow permission limited to `contents: write`.
- Public routes are static/SSG; there are no visitor-triggered server functions.
- Calculator kit requests go directly from the browser to the public data CDN.

Keep secrets out of the repository and client components. If a future Riot API
key is introduced, keep it server-side and use one product per production key.

## Analytics

Use one free analytics system during validation. Track only the essential
funnel: calculator selection, meaningful result viewed, Build A versus Build B
created, comparison link copied, and confirmed data error reported.

Do not install multiple trackers. Publish a privacy notice before collecting
persistent identifiers or advertising data.

## SEO

The app already has route metadata, canonical configuration, social images,
`/sitemap.xml`, `/robots.txt`, JSON-LD, and static patch/champion pages.

When a domain is selected, set:

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

Redeploy and submit the sitemap to Google Search Console and Bing Webmaster
Tools.
