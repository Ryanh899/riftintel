#!/usr/bin/env python3
"""
RiftIntel ingest pipeline

- Discovers LoL patch pages on the League wiki (free MediaWiki API)
- Parses champions / items / runes / systems into structured JSON
- Builds accurate rule-based TL;DRs from the actual change lines
- Optionally runs local Ollama (llama3.1:8b) once per entity for gameplay impact — $0

Usage:
  python scripts/ingest/run_ingest.py --years 5
  python scripts/ingest/run_ingest.py --years 5 --ai
  python scripts/ingest/run_ingest.py --patches 14.1,14.10 --ai
  python scripts/ingest/run_ingest.py --years 5 --skip-fetch   # parse cached only
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from ddragon import champion_key, item_key, load_champion_map, load_item_map
from parse_wikitext import (
    AbilityBlock,
    EntityBlock,
    classify_lines,
    parse_before_after,
    parse_patch_page,
    severity_from_lines,
)
from summarize import (
    DEFAULT_MODEL,
    batch_gameplay_impacts,
    batch_patch_summary,
    ollama_available,
    summarize_entity_local,
    summarize_patch_local,
)
from wiki_client import WikiClient

DATA = ROOT / "src" / "data"
PATCH_OUT = DATA / "patches" / "by-id"
CACHE = ROOT / ".cache" / "wiki"
MANIFEST = DATA / "patches" / "manifest.json"

# Patch ID patterns we care about (exclude TFT, subpages)
PATCH_TITLE_RE = re.compile(
    r"^V("
    r"1[1-4]\.\d{1,2}"  # 11.x – 14.x classic
    r"|1[5-9]\.\d{1,2}"  # 15–19 if ever
    r"|2[0-9]\.\d{1,2}"  # 20.x – 29.x (year-style 26.14)
    r"|25\.S\d+\.\d+"  # 25.S1.3 seasonal
    r"|25\.\d{1,2}"  # 25.24 style
    r")$"
)


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"['.]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def discover_patch_titles(client: WikiClient, years: int) -> list[str]:
    """Find wiki patch pages covering roughly the last `years` years."""
    # Season / year prefixes to scan
    this_year = date.today().year
    # Map calendar years to patch prefix families used by Riot
    prefixes: list[str] = []
    for y in range(this_year - years, this_year + 1):
        # 2021–2024 used 11.x–14.x (season year - 2010 roughly... 2021=11)
        # Actually: Season 11 = 2021 = patches 11.x
        if 2010 < y < 2025:
            prefixes.append(f"V{y - 2010}.")
        if y >= 2025:
            prefixes.append(f"V{y - 2000}.")  # V25., V26.
            prefixes.append(f"V{y}.")  # just in case
        prefixes.append(f"V{y % 100}.")

    # Also always include known modern prefixes
    for p in ("V11.", "V12.", "V13.", "V14.", "V15.", "V25.", "V26.", "V27."):
        if p not in prefixes:
            prefixes.append(p)

    seen: set[str] = set()
    titles: list[str] = []
    for prefix in prefixes:
        for t in client.list_pages_with_prefix(prefix):
            if t in seen:
                continue
            # skip TFT and subpages
            if "(Teamfight Tactics)" in t or "/" in t:
                continue
            if not PATCH_TITLE_RE.match(t.replace(" ", "")):
                # allow V25.S1.3 etc with spaces stripped
                compact = t.replace(" ", "")
                if not PATCH_TITLE_RE.match(compact):
                    continue
            seen.add(t)
            titles.append(t)

    # Sort by natural patch order (approx)
    titles.sort(key=patch_sort_key, reverse=True)
    return titles


def patch_sort_key(title: str) -> tuple:
    v = title.lstrip("V")
    # 25.S1.3
    m = re.match(r"(\d+)\.S(\d+)\.(\d+)", v, re.I)
    if m:
        return (int(m.group(1)), int(m.group(2)), int(m.group(3)), 0)
    m = re.match(r"(\d+)\.(\d+)", v)
    if m:
        major, minor = int(m.group(1)), int(m.group(2))
        # 11-14 are older than 25-26
        era = major if major >= 20 else major  # fine numerically 14 < 25
        return (era, minor, 0, 0)
    return (0, 0, 0, 0)


def filter_by_years(titles: list[str], metas_dates: dict[str, str | None], years: int) -> list[str]:
    cutoff = date.today() - timedelta(days=int(years * 365.25))
    kept = []
    for t in titles:
        d = metas_dates.get(t)
        if not d:
            kept.append(t)  # keep if unknown date; refine later
            continue
        try:
            dt = datetime.strptime(d, "%Y-%m-%d").date()
            if dt >= cutoff:
                kept.append(t)
        except ValueError:
            kept.append(t)
    return kept


def entity_to_json(
    block: EntityBlock,
    *,
    cmap: dict[str, str],
    imap: dict[str, str],
    include_bugfixes: bool,
) -> dict | None:
    direction = classify_lines(block.raw_lines, block.header_note)
    if not include_bugfixes and direction == "bugfix":
        return None
    # Drop cosmetic/skin-only noise (no real balance lines)
    balance_lines = [
        ln
        for ln in block.raw_lines
        if not re.search(r"\bbug fix\b|\bfixed\b", ln, re.I)
        and not re.search(r"\bchroma\b|\bskin\b|\bvfx\b|\bsfx\b|\bmodel\b", ln, re.I)
    ]
    if not include_bugfixes and not balance_lines and not (
        block.header_note
        and re.search(r"gameplay update|rework|update", block.header_note, re.I)
    ):
        return None

    summaries = summarize_entity_local(
        block.name,
        direction,
        block.raw_lines,
        block.header_note,
    )

    changes = []
    for ab in block.abilities:
        if not ab.lines:
            continue
        adir = classify_lines(ab.lines, None)
        lines_out = []
        for ln in ab.lines:
            parsed = parse_before_after(ln)
            if parsed:
                lines_out.append(
                    {
                        "label": parsed["label"],
                        "before": parsed["before"],
                        "after": parsed["after"],
                        "note": ln if len(ln) < 200 else None,
                    }
                )
            else:
                lines_out.append({"label": "Change", "note": ln})
        changes.append(
            {
                "ability": ab.ability[:48],
                "title": ab.title,
                "direction": adir if adir != "bugfix" else direction,
                "lines": lines_out,
            }
        )

    if not changes and not block.raw_lines:
        return None

    asset = None
    if block.kind == "champion":
        asset = champion_key(block.name, cmap)
    elif block.kind == "item":
        asset = item_key(block.name, imap)

    return {
        "id": slugify(block.name),
        "name": block.name,
        "type": "system" if block.kind == "system" else block.kind,
        "assetKey": asset,
        "roles": [],
        "direction": direction if direction != "bugfix" else "adjust",
        "severity": severity_from_lines(block.raw_lines, direction),
        "tldr": summaries["tldr"],
        "gameplayImpact": summaries["gameplayImpact"],
        "context": block.header_note,
        "changes": changes
        or [
            {
                "ability": "Notes",
                "direction": direction if direction != "bugfix" else "adjust",
                "lines": [{"label": "Change", "note": ln} for ln in block.raw_lines[:20]],
            }
        ],
        "tags": [direction] + ([block.header_note] if block.header_note else []),
        "_balanceLines": balance_lines[:8],
    }


def build_patch_json(
    page_title: str,
    parsed: dict,
    *,
    cmap: dict,
    imap: dict,
    use_ai: bool,
    model: str,
    include_bugfixes: bool,
) -> dict:
    meta = parsed["meta"]
    champions = []
    for b in parsed["champions"]:
        e = entity_to_json(
            b, cmap=cmap, imap=imap, include_bugfixes=include_bugfixes
        )
        if e:
            champions.append(e)

    items = []
    for b in parsed["items"]:
        e = entity_to_json(
            b, cmap=cmap, imap=imap, include_bugfixes=include_bugfixes
        )
        if e:
            items.append(e)

    systems = []
    for b in list(parsed["runes"]) + list(parsed["systems"]):
        e = entity_to_json(
            b, cmap=cmap, imap=imap, include_bugfixes=include_bugfixes
        )
        if e:
            if b.kind == "rune":
                e["type"] = "rune"
            systems.append(e)

    all_ents = champions + items + systems
    blurbs = [c["tldr"] for c in all_ents[:25]]

    # Free local AI: one batch call per patch (not per visitor)
    if use_ai and all_ents:
        print(f"  ollama batch summarize ({len(all_ents)} entities)…")
        payload = []
        for e in all_ents:
            bal = e.pop("_balanceLines", None) or []
            if not bal:
                bal = [
                    ln.get("note")
                    or f"{ln.get('label')}: {ln.get('before')} → {ln.get('after')}"
                    for ch in e.get("changes", [])
                    for ln in ch.get("lines", [])
                    if ln.get("note") or ln.get("before")
                ][:6]
            payload.append(
                {
                    "id": e["id"],
                    "name": e["name"],
                    "type": e["type"],
                    "direction": e["direction"],
                    "tldr": e["tldr"],
                    "lines": bal,
                }
            )

        impacts = batch_gameplay_impacts(payload, version=meta.version, model=model)
        applied = 0
        for e in all_ents:
            if e["id"] in impacts:
                e["gameplayImpact"] = impacts[e["id"]]
                applied += 1
        print(f"  ollama applied impacts to {applied}/{len(all_ents)}")

        ai_sum = batch_patch_summary(
            meta.version, meta.caption, blurbs, model=model
        )
        summary = ai_sum or summarize_patch_local(meta.version, meta.caption, blurbs)
    else:
        for e in all_ents:
            e.pop("_balanceLines", None)
        summary = summarize_patch_local(meta.version, meta.caption, blurbs)

    themes = []
    if meta.caption:
        themes.append(
            {"title": "Patch theme", "description": meta.caption[:280]}
        )

    buffs = sum(1 for c in champions if c["direction"] == "buff")
    nerfs = sum(1 for c in champions if c["direction"] == "nerf")
    if buffs or nerfs:
        themes.append(
            {
                "title": "Champion balance",
                "description": f"{buffs} champion buffs, {nerfs} nerfs in this patch (excluding pure bugfixes).",
            }
        )

    pid = meta.version
    return {
        "id": pid,
        "version": pid,
        "title": meta.title if meta.title else f"Patch {pid}",
        "releaseDate": meta.release_date or "1970-01-01",
        "season": str(pid).split(".")[0],
        "themes": themes,
        "summary": summary,
        # Cloud ingest sets false; local Ollama enrich flips to true
        "aiEnriched": bool(use_ai),
        "champions": champions,
        "items": items,
        "systems": systems,
        "sourceUrl": meta.source_url
        or f"https://wiki.leagueoflegends.com/en-us/V{pid}",
        "source": "league-wiki",
        "wikiPage": page_title,
    }


def write_manifest(patches: list[dict]) -> None:
    # newest first by release date then version
    def key(p: dict):
        return (p.get("releaseDate") or "", patch_sort_key("V" + p["id"]))

    patches_sorted = sorted(patches, key=key, reverse=True)
    entries = []
    for p in patches_sorted:
        ents = p["champions"] + p["items"] + p["systems"]
        entries.append(
            {
                "id": p["id"],
                "version": p["version"],
                "title": p["title"],
                "releaseDate": p["releaseDate"],
                "championCount": len(p["champions"]),
                "itemCount": len(p["items"]),
                "buffCount": sum(1 for e in ents if e["direction"] == "buff"),
                "nerfCount": sum(1 for e in ents if e["direction"] == "nerf"),
                "adjustCount": sum(
                    1 for e in ents if e["direction"] in ("adjust", "rework")
                ),
            }
        )
    MANIFEST.write_text(
        json.dumps(
            {
                "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "patches": entries,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote manifest with {len(entries)} patches → {MANIFEST}")


def rebuild_champion_histories(patches: list[dict]) -> None:
    out_dir = DATA / "champions"
    out_dir.mkdir(parents=True, exist_ok=True)
    hist: dict[str, dict] = {}
    for p in sorted(patches, key=lambda x: x.get("releaseDate") or ""):
        for ch in p["champions"]:
            slug = ch["id"]
            if slug not in hist:
                hist[slug] = {
                    "slug": slug,
                    "name": ch["name"],
                    "assetKey": ch.get("assetKey"),
                    "entries": [],
                }
            hist[slug]["entries"].append(
                {
                    "patchId": p["id"],
                    "version": p["version"],
                    "releaseDate": p["releaseDate"],
                    "change": ch,
                }
            )
            if ch.get("assetKey"):
                hist[slug]["assetKey"] = ch["assetKey"]

    for slug, data in hist.items():
        (out_dir / f"{slug}.json").write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    index = [
        {
            "slug": h["slug"],
            "name": h["name"],
            "assetKey": h.get("assetKey"),
            "changeCount": len(h["entries"]),
            "lastPatch": h["entries"][-1]["version"] if h["entries"] else None,
            "lastDirection": h["entries"][-1]["change"]["direction"] if h["entries"] else None,
        }
        for h in sorted(hist.values(), key=lambda x: x["name"])
    ]
    (out_dir / "index.json").write_text(
        json.dumps(index, indent=2), encoding="utf-8"
    )
    print(f"Wrote {len(hist)} champion histories → {out_dir}")


def main() -> int:
    ap = argparse.ArgumentParser(description="Ingest LoL patch notes into RiftIntel")
    ap.add_argument("--years", type=float, default=5.0, help="How many years back to pull")
    ap.add_argument("--patches", type=str, default="", help="Comma list of versions e.g. 14.1,26.14")
    ap.add_argument("--ai", action="store_true", help="Use local Ollama for gameplay summaries ($0)")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--include-bugfixes", action="store_true")
    ap.add_argument("--skip-fetch", action="store_true", help="Only use wiki cache")
    ap.add_argument("--limit", type=int, default=0, help="Max patches to process (0=all)")
    ap.add_argument(
        "--only-new",
        action="store_true",
        help="Skip patch versions that already exist under by-id/",
    )
    args = ap.parse_args()

    PATCH_OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)

    client = WikiClient(CACHE)
    cmap = load_champion_map(CACHE)
    imap = load_item_map(CACHE)

    use_ai = args.ai
    if use_ai:
        if ollama_available():
            print(f"Ollama available — using model {args.model} (free, local)")
        else:
            print("WARNING: --ai set but Ollama not reachable; falling back to heuristics")
            use_ai = False

    # Discover
    if args.patches:
        titles = []
        for p in args.patches.split(","):
            p = p.strip()
            if not p:
                continue
            if p.upper().startswith("V"):
                titles.append("V" + p[1:])
            else:
                titles.append("V" + p)
    else:
        print(f"Discovering patches (~{args.years} years)…")
        titles = discover_patch_titles(client, int(args.years) + 1)
        print(f"  found {len(titles)} candidate pages")

    if args.limit:
        titles = titles[: args.limit]

    patches_out: list[dict] = []
    for i, title in enumerate(titles, 1):
        print(f"[{i}/{len(titles)}] {title}")
        # Early only-new check from title version
        ver_guess = title.lstrip("V").replace(" ", "")
        if args.only_new and (PATCH_OUT / f"{ver_guess}.json").exists():
            print(f"  skip (already have {ver_guess}.json)")
            continue

        if args.skip_fetch:
            # force read cache only by using client cache; if missing, fetch still happens
            pass
        wikitext = client.parse_wikitext(title, use_cache=True)
        if not wikitext:
            print(f"  skip (no wikitext)")
            continue
        try:
            parsed = parse_patch_page(wikitext, title)
        except Exception as e:
            print(f"  parse error: {e}")
            continue

        # Date filter when not explicit list
        if not args.patches and parsed["meta"].release_date:
            try:
                rd = datetime.strptime(parsed["meta"].release_date, "%Y-%m-%d").date()
                cutoff = date.today() - timedelta(days=int(args.years * 365.25))
                if rd < cutoff:
                    print(f"  skip (older than {args.years}y: {rd})")
                    continue
            except ValueError:
                pass

        # only-new after we know the real version id from parse
        real_id = parsed["meta"].version or ver_guess
        if args.only_new and (PATCH_OUT / f"{real_id}.json").exists():
            print(f"  skip (already have {real_id}.json)")
            continue

        patch = build_patch_json(
            title,
            parsed,
            cmap=cmap,
            imap=imap,
            use_ai=use_ai,
            model=args.model,
            include_bugfixes=args.include_bugfixes,
        )
        # Skip nearly empty patches
        if not patch["champions"] and not patch["items"] and not patch["systems"]:
            print("  skip (no structured balance changes)")
            continue

        out_path = PATCH_OUT / f"{patch['id']}.json"
        out_path.write_text(json.dumps(patch, ensure_ascii=False, indent=2), encoding="utf-8")
        print(
            f"  → {out_path.name}: {len(patch['champions'])} champs, "
            f"{len(patch['items'])} items, {len(patch['systems'])} systems"
        )
        patches_out.append(patch)

    # Also load any existing by-id patches not in this run (merge)
    existing = {p["id"]: p for p in patches_out}
    for f in PATCH_OUT.glob("*.json"):
        if f.stem not in existing:
            try:
                existing[f.stem] = json.loads(f.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                pass
    all_patches = list(existing.values())

    write_manifest(all_patches)
    rebuild_champion_histories(all_patches)
    print(f"Done. {len(all_patches)} patches ready.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
