# RiftIntel

**What Riot's patch notes actually mean.**

The intelligence layer on League of Legends updates — real numbers, champion
history, and build damage. Free unofficial fan tool.

## Brand

| Element | Meaning |
|---------|---------|
| **Rift** | The map / the game |
| **Intel** | Signal, clarity, analysis |
| **Mark** | Scan node + compass ticks + teal signal blips |
| **Accent** | Intel blue `#4f8cff` |
| **Signal** | Teal `#5eead4` |

## Features

| Route | What it does |
|-------|----------------|
| `/` | Latest patch — buff/nerf overview, filters, numbers |
| `/patches` | All patches — full balance history |
| `/champions` | Per-champion change timelines |
| `/calculator` | Ability damage (items, ranks, runes, pen) |
| `/compare` | Diff two patches |

## Local development

```bash
cd Documents/patchlens
npm install
npm run dev
```

```bash
npm run prod:check   # verify + lint + build
npm start            # production serve locally
```

## Keeping patches current

- **GitHub Actions** (every 4h): ingest **new** wiki patches **without** AI → auto-commit.  
- **Your PC + Ollama**: `npm run update:local:push` fills AI blurbs for anything still pending and pushes.  

Details: [`docs/AUTO_UPDATE.md`](docs/AUTO_UPDATE.md).

## Cost

No paid APIs required. Static data + free CDNs. Optional local Ollama for ingest summaries (never per visitor).

**Cost-safe beta:** Vercel Hobby may be used only for the free, noncommercial validation stage. It does not include Spend Management. Choose a documented commercial hosting path before enabling revenue. See [`docs/COST_SECURITY_MARKETING.md`](docs/COST_SECURITY_MARKETING.md).

## Analytics & SEO

- Vercel Web Analytics (built-in after deploy)
- Optional GA4: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Sitemap `/sitemap.xml`, robots, Open Graph, JSON-LD
- When you add a domain: set `NEXT_PUBLIC_SITE_URL=https://your.domain`

## Legal

RiftIntel is not endorsed by Riot Games and does not reflect the views or
opinions of Riot Games or anyone officially involved in producing or managing
Riot Games properties. Riot Games and all associated properties are trademarks
or registered trademarks of Riot Games, Inc.
