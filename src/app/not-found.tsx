import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <div className="flex justify-center">
        <BrandMark />
      </div>
      <p className="font-data text-[11px] uppercase tracking-wider text-muted">
        404
      </p>
      <h1 className="font-data text-2xl font-semibold text-fg">not found</h1>
      <p className="text-sm text-muted">That page doesn&apos;t exist.</p>
      <div className="flex justify-center gap-4 pt-2 font-data text-[12px]">
        <Link href="/" className="text-accent hover:underline">
          latest patch
        </Link>
        <Link href="/patches" className="text-muted hover:text-fg">
          all patches
        </Link>
        <Link href="/calculator" className="text-muted hover:text-fg">
          dmg
        </Link>
      </div>
    </div>
  );
}
