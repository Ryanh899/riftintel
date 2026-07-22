# Cost, security, SEO & analytics (RiftIntel)

## Never get surprise charges

RiftIntel is designed for **Vercel Hobby (free)** + free data sources.

### Required: lock spend at $0 on Vercel

1. Open [Vercel Dashboard → Settings → Billing](https://vercel.com/account/billing)  
2. Enable **Spend Management** / spending limit  
3. Set limit to **$0** (or the lowest allowed + alerts at $1 if $0 isn’t offered)  
4. Stay on **Hobby** — do **not** upgrade to Pro unless you choose to  
5. Do **not** enable paid add-ons (commercial databases, paid AI, etc.)

If traffic spikes on Hobby, Vercel typically **throttles / soft-limits** free projects rather than charging without a paid plan. With a **$0 spend cap**, you should not be billed unless **you** raise the cap or upgrade.

### What is free on this stack

| Thing | Cost |
|--------|------|
| Vercel Hobby hosting | $0 |
| GitHub Actions (public repo) | $0 within free minutes |
| Data Dragon / Meraki CDNs | $0 |
| Vercel Web Analytics (basic) | $0 on Hobby |
| Google Analytics 4 (optional) | $0 |
| Local Ollama for ingest | $0 (your PC) |

### What would cost money (only if you opt in)

- Vercel Pro / Team  
- Raising the spend cap  
- Paid analytics (Plausible Pro, etc.)  
- Cloud LLM APIs (we do **not** use these in prod)

---

## Analytics (marketing experiments)

Already wired:

1. **Vercel Analytics** — page views in the Vercel project → Analytics tab  
2. **Optional GA4** — set env `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...` in Vercel → redeploy  

Use Analytics to compare traffic before/after social posts, Reddit, etc.

No analytics package bills you for “heavy traffic” the way paid AI would; still keep Hobby + spend cap.

---

## SEO (no design sacrifice)

- `metadataBase` + Open Graph / Twitter  
- `/sitemap.xml` — home, patches, champions, calculator  
- `/robots.txt` — allow crawl, disallow `/api/`  
- JSON-LD `WebSite` schema  
- Semantic titles per route (existing)  

When you add a domain:

1. Add domain in Vercel  
2. Set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`  
3. Redeploy  

---

## Security (baseline)

Already / now in place:

- HTTPS via Vercel  
- `X-Content-Type-Options: nosniff`  
- `X-Frame-Options: DENY`  
- `Referrer-Policy: strict-origin-when-cross-origin`  
- `Permissions-Policy` (camera/mic/geo off)  
- `poweredByHeader: false`  
- `/api/*` not for secret work (public data only)  
- No secrets required for core app  

Recommended:

- Keep repo free of `.env` secrets (use Vercel env UI)  
- Don’t paste API keys into client components  
- Review GitHub Actions permissions (workflow only needs `contents: write` for data commits)

---

## Feedback

Footer + About link to GitHub Issues:

`https://github.com/Ryanh899/riftintel/issues/new`

Change with `NEXT_PUBLIC_FEEDBACK_URL` if you switch to a form later.
