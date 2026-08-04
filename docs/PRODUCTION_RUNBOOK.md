# Production launch runbook

Last reviewed: August 4, 2026.

## What is production-ready in code

- All public pages are prerendered; there are no visitor-triggered server functions.
- Current calculator kits are downloaded during the build and served as same-origin static JSON.
- Only verified history is copied into calculator comparison assets.
- Patch candidates are polled every four hours, directly probed, validated, and quarantined on failure.
- A clean run performs ingestion tests, accuracy checks, lint, TypeScript, and the full static build before pushing data.
- Privacy, terms, source attribution, Riot disclaimer, RSS, sitemap, social metadata, event analytics, and feedback are present.

## Owner actions before public launch

1. Submit the packet in `docs/RIOT_PRODUCT_REGISTRATION.md` through the Riot Developer Portal.
2. Decide whether this launch is a free noncommercial beta or a commercial launch.
3. For a free beta, keep Vercel Hobby noncommercial and accept quota pause as the hard stop.
4. Before any revenue, move to a commercially permitted hosting plan and configure its hard spending/automatic-pause controls. Do not monetize on Hobby.
5. Buy/connect a short domain only after confirming the renewal price. Set `NEXT_PUBLIC_SITE_URL` and redeploy.
6. Add the domain to Google Search Console and Bing Webmaster Tools; submit `/sitemap.xml`.
7. In GitHub, enable email/mobile notifications for failed Actions on the repository. Manually run **Patch data update** once and confirm green.
8. In the hosting dashboard, enable Web Analytics, set traffic/usage notifications, and do not enable paid add-ons.
9. Test production on iPhone/Android widths and one desktop browser after DNS is live.

## Release procedure

1. Pull `master`; require a clean working tree.
2. Run `npm run prod:check` and `npm run test:ingest`.
3. Review the latest patch source link, verified badge, champion/item counts, and calculator result.
4. Push to GitHub and wait for the deployment to complete.
5. Smoke-test `/`, `/calculator`, `/worlds`, `/feed.xml`, `/sitemap.xml`, `/privacy`, and `/terms`.
6. Publish the prepared launch posts only after the production checks pass.

## Patch-day procedure

1. GitHub checks likely versions directly every four hours; optionally run the workflow manually when official notes appear.
2. If the workflow fails, read the failed ingest/validation step. Never copy a quarantined file into `by-id` to beat a deadline.
3. Confirm the patch page is official, the release date is correct, and alternate modes are absent from the Summoner's Rift page.
4. Publish one factual “what changed” post, one champion/build example, and one correction if source notes change.
5. Watch useful/not-useful feedback and wrong-number reports for 24 hours.

## Cost incident procedure

If traffic or billing risk appears: pause marketing, confirm there are still no dynamic functions, disable optional analytics first, and use the host's project pause/hard-stop control. Do not add a card or raise a limit while diagnosing. A temporary outage is preferable to an uncapped charge.

## Rollback

Vercel can promote the prior successful deployment. GitHub preserves every shipped version. Roll back the deployment first, then fix forward on a new commit; do not rewrite `master` history or bypass patch validation.
