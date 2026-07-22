/**
 * Public site config — marketing, SEO, feedback.
 * Override with env in Vercel (still free).
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://riftintel.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "RiftIntel";

/** Share / Google snippet title (not an in-app H1). */
export const SITE_TITLE =
  "RiftIntel — What Riot's patch notes actually mean";

/**
 * Share / Google description.
 * Positioning: intelligence layer on top of Riot updates — not "another LoL tool."
 */
export const SITE_DESCRIPTION =
  "Riot publishes the raw notes. RiftIntel shows what they actually mean — real numbers, champion history, and build damage for every League of Legends patch.";

export const SITE_TAGLINE = "The intelligence layer on Riot's updates";

/** Google Analytics 4 measurement ID (G-XXXXXXXX). Empty = disabled. Free. */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

/** Where users can leave feedback (GitHub Issues by default). */
export const FEEDBACK_URL =
  process.env.NEXT_PUBLIC_FEEDBACK_URL?.trim() ||
  "https://github.com/Ryanh899/riftintel/issues/new";

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
