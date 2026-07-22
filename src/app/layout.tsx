import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
import "./globals.css";

const display = DM_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const data = JetBrains_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "League of Legends",
    "patch notes explained",
    "LoL balance intelligence",
    "buffs nerfs",
    "damage calculator",
    "champion history",
    "RiftIntel",
    "patch day",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: `${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
  },
  other: {
    "theme-color": "#05070c",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${data.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <JsonLd />
        <Header />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-3 py-4 sm:px-5 sm:py-5">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
