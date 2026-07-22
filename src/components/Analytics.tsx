"use client";

import Script from "next/script";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { GA_MEASUREMENT_ID } from "@/lib/site";

/**
 * Free traffic analytics for marketing experiments.
 * - Vercel Web Analytics: free on Hobby (page views; no card required for free tier)
 * - Optional GA4: set NEXT_PUBLIC_GA_MEASUREMENT_ID in Vercel env (Google free tier)
 *
 * Neither bills you automatically for traffic on free plans. Keep Vercel Hobby +
 * spend cap $0 so usage never upgrades without your action.
 */
export function Analytics() {
  const ga = GA_MEASUREMENT_ID;

  return (
    <>
      <VercelAnalytics />
      {ga ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
