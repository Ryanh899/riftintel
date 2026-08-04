"use client";

import { track } from "@vercel/analytics/react";

type EventValue = string | number | boolean | null | undefined;

export function trackEvent(
  name: string,
  properties: Record<string, EventValue> = {},
) {
  try {
    track(name, properties);
  } catch {
    // Analytics must never interrupt the product.
  }

  if (typeof window !== "undefined") {
    const dataLayer = (
      window as Window & { dataLayer?: Array<Record<string, EventValue>> }
    ).dataLayer;
    dataLayer?.push({ event: name, ...properties });
  }
}
