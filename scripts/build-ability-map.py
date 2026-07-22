#!/usr/bin/env python3
"""Build ability name → P/Q/W/E/R map from Meraki champions dump."""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "assets" / "ability-letters.json"
URL = "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json"


def main() -> None:
    raw = json.load(urllib.request.urlopen(URL))
    name_to_letter: dict[str, str] = {}
    for _cname, ch in raw.items():
        ab = ch.get("abilities") or {}
        for key in ("P", "Q", "W", "E", "R"):
            for form in ab.get(key) or []:
                n = form.get("name")
                if not n:
                    continue
                low = n.lower().strip()
                name_to_letter[low] = key
                compact = "".join(c for c in low if c.isalnum() or c == " ").strip()
                name_to_letter[compact] = key
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"byName": name_to_letter}, indent=2),
        encoding="utf-8",
    )
    print(f"wrote {len(name_to_letter)} ability names → {OUT}")


if __name__ == "__main__":
    main()
