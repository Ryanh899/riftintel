"use client";

import Script from "next/script";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { GA_MEASUREMENT_ID } from "@/lib/site";

/**
 * Privacy-light traffic analytics for product and marketing experiments.
 * - Vercel Web Analytics: page views and low-cardinality product events
 * - Optional GA4: set NEXT_PUBLIC_GA_MEASUREMENT_ID in Vercel env (Google free tier)
 *
 * Hosting plan and usage safeguards are documented separately because commercial
 * availability and billing controls can change independently of this code.
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
