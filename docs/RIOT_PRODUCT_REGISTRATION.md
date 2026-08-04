# Riot product registration packet

Last prepared: August 4, 2026. Recheck the current League Developer Policy before submitting.

## Owner fields to complete

- Product owner/legal name: **[complete before submission]**
- Contact email: **[complete before submission]**
- Business/entity name, if any: **[complete before submission]**
- Production domain: `https://riftintel.vercel.app/` until a custom domain is connected
- Repository: `https://github.com/Ryanh899/riftintel`

## Submission description

RiftIntel is an unofficial League of Legends study tool focused on Summoner's Rift balance patches. It converts public patch-note changes into structured champion, item, rune, and system pages; provides per-champion change timelines; and includes a deterministic client-side damage calculator for comparing items, runes, skill ranks, targets, spell rotations, and basic attacks. The product helps players understand how a public balance change affects a build or champion pool. It does not automate gameplay, expose hidden information, rank players, facilitate betting, or provide an in-client competitive advantage.

## Player-facing features

1. Latest-patch overview with source links and verified/archive-review labels.
2. Searchable patch, champion, and item history.
3. Client-side build and spell-rotation damage modeling with confidence disclosures.
4. Local-only champion pool for patch-change alerts on return visits.
5. Shareable calculation links and image cards.
6. Worlds patch-watch hub and RSS patch feed.

## Data and infrastructure

- Public patch notes and schedule pages from Riot Games.
- Public League Wiki patch pages used during offline ingestion.
- Riot Data Dragon and CommunityDragon assets.
- Meraki Analytics public champion kit data for current calculator formulas.
- No Riot API key is currently required.
- No user accounts, summoner lookup, match history, or production database.
- No hosted AI or per-visitor AI request. Optional explanation enrichment runs locally before publication.
- Ordinary visits are fully static; current kit JSON is fetched by the visitor's browser from the public data CDN.

## Accuracy and safety controls

- Every new imported patch must pass publication-blocking numeric and markup validation.
- Rejected candidates are quarantined and cannot publish automatically.
- Older imported history that has not passed the current gate is visibly labeled archive under review.
- Alternate-mode changes are excluded from the Summoner's Rift dataset.
- Calculator estimates disclose unsupported mechanics and post-mitigation assumptions.
- Every page retains the required Riot fan-product disclaimer and links to primary sources.

## Proposed monetization (do not enable before acknowledgment/approval)

The meaningful free tier will retain current patch analysis, champion history, the core calculator, local champion pools, and RSS. Possible paid value would be transformative workflow features such as cross-device saved build workspaces, private notes, export packs, and team study boards. Raw Riot facts, public patch notes, and basic access will not be paywalled. Advertising or sponsorship, if later used, will be clearly labeled and will not include betting, account boosting, or products prohibited by Riot policy.

## Required notice

RiftIntel is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

## Submission checklist

- [ ] Complete owner/contact fields.
- [ ] Connect the final custom domain and update `NEXT_PUBLIC_SITE_URL`, or submit the current live URL.
- [ ] Capture desktop and mobile screenshots of Latest, Calculator, Champion Pool, and the archive warning.
- [ ] Confirm Privacy and Terms links are live.
- [ ] Confirm the GitHub patch updater is green.
- [ ] Re-read the current League Developer Policy and Legal Jibber Jabber.
- [ ] Submit/register through the Riot Developer Portal.
- [ ] Save the submission date, product ID, status, and Riot response in this file.
- [ ] Do not enable revenue until the product status and proposed model permit it.

Official references: [League developer policy](https://developer.riotgames.com/docs/lol), [Riot legal terms](https://www.riotgames.com/en/legal).
