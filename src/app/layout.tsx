import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  title: {
    default: "RiftIntel — LoL patch analysis",
    template: "%s · RiftIntel",
  },
  description:
    "RiftIntel: League of Legends balance intelligence — buffs, nerfs, real numbers, champion history, and build damage. Free unofficial fan tool.",
  applicationName: "RiftIntel",
  keywords: [
    "League of Legends",
    "patch notes",
    "buffs nerfs",
    "damage calculator",
    "LoL balance",
    "RiftIntel",
  ],
  authors: [{ name: "RiftIntel" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "RiftIntel — LoL patch analysis",
    description:
      "Buffs, nerfs, numbers, and build damage — intel for the Rift.",
    type: "website",
    locale: "en_US",
    siteName: "RiftIntel",
  },
  twitter: {
    card: "summary",
    title: "RiftIntel — LoL patch analysis",
    description:
      "Buffs, nerfs, numbers, and build damage for League of Legends.",
  },
  icons: {
    icon: [{ url: "/brand-mark.svg", type: "image/svg+xml" }],
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
        <Header />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-3 py-4 sm:px-5 sm:py-5">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
