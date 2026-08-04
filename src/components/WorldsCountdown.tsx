"use client";

import { useEffect, useState } from "react";

const WORLDS_START = Date.parse("2026-10-15T00:00:00+08:00");

export function WorldsCountdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (now == null) return <span>Worlds begins October 15</span>;
  const remaining = WORLDS_START - now;
  if (remaining <= 0) return <span>Worlds 2026 is underway</span>;

  const days = Math.ceil(remaining / 86_400_000);
  return <span>{days} days until Worlds 2026</span>;
}
