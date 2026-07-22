/**
 * Public site config — marketing, SEO, feedback.
 * Override with env in Vercel (still free).
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://riftintel.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "RiftIntel";

export const SITE_DESCRIPTION =
  "League of Legends balance intelligence — buffs, nerfs, real numbers, champion history, and build damage. Free unofficial fan tool.";

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
