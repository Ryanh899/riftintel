#!/usr/bin/env python3
"""
Re-enrich existing by-id patch JSON with local Ollama ($0).

Used when cloud CI ingested without --ai (aiEnriched: false). Run on your PC
with Ollama up; then commit/push so production gets better gameplay blurbs.

  python scripts/ingest/enrich_ai.py
  python scripts/ingest/enrich_ai.py --limit 3
  python scripts/ingest/enrich_ai.py --force   # re-AI all patches (slow)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from summarize import (
    DEFAULT_MODEL,
    batch_gameplay_impacts,
    batch_patch_summary,
    ollama_available,
    summarize_patch_local,
)
from run_ingest import rebuild_champion_histories, write_manifest

PATCH_OUT = ROOT / "src" / "data" / "patches" / "by-id"
MANIFEST = ROOT / "src" / "data" / "patches" / "manifest.json"


def needs_ai(patch: dict, force: bool) -> bool:
    if force:
        return True
    # Explicit false from cloud ingest
    if patch.get("aiEnriched") is False:
        return True
    # Missing field on brand-new cloud files only — never re-AI entire history
    # unless force. Treat missing as already done (legacy ingest).
    return False


def enrich_patch(path: Path, model: str) -> bool:
    patch = json.loads(path.read_text(encoding="utf-8"))
    ents = (
        list(patch.get("champions") or [])
        + list(patch.get("items") or [])
        + list(patch.get("systems") or [])
    )
    if not ents:
        patch["aiEnriched"] = True
        path.write_text(json.dumps(patch, ensure_ascii=False, indent=2), encoding="utf-8")
        return True

    payload = []
    for e in ents:
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
                "type": e.get("type"),
                "direction": e.get("direction"),
                "tldr": e.get("tldr") or "",
                "lines": bal,
            }
        )

    print(f"  ollama enrich {path.name} ({len(payload)} entities)…")
    impacts = batch_gameplay_impacts(
        payload, version=patch.get("version") or path.stem, model=model
    )
    applied = 0
    for e in ents:
        if e["id"] in impacts:
            e["gameplayImpact"] = impacts[e["id"]]
            applied += 1

    blurbs = [c.get("tldr") or "" for c in ents[:25]]
    ai_sum = batch_patch_summary(
        patch.get("version") or path.stem,
        (patch.get("title") or "")[:120],
        blurbs,
        model=model,
    )
    if ai_sum:
        patch["summary"] = ai_sum
    elif not patch.get("summary"):
        patch["summary"] = summarize_patch_local(
            patch.get("version") or path.stem,
            patch.get("title") or "",
            blurbs,
        )

    patch["aiEnriched"] = True
    path.write_text(json.dumps(patch, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  → applied {applied}/{len(ents)} impacts")
    return applied > 0 or bool(ai_sum)


def main() -> int:
    ap = argparse.ArgumentParser(description="Ollama-enrich existing patch JSON")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--limit", type=int, default=0, help="Max patches to enrich (0=all pending)")
    ap.add_argument("--force", action="store_true", help="Re-enrich every patch")
    args = ap.parse_args()

    if not ollama_available():
        print("Ollama not reachable at http://127.0.0.1:11434 — start it and retry.")
        return 1

    files = sorted(PATCH_OUT.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    pending: list[Path] = []
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if needs_ai(data, args.force):
            pending.append(f)

    if args.limit:
        pending = pending[: args.limit]

    if not pending:
        print("No patches pending AI enrichment.")
        return 0

    print(f"Enriching {len(pending)} patch(es) with {args.model}…")
    ok = 0
    for f in pending:
        print(f"[{ok + 1}/{len(pending)}] {f.name}")
        try:
            enrich_patch(f, args.model)
            ok += 1
        except Exception as e:
            print(f"  error: {e}")

    if ok:
        all_patches = []
        for f in PATCH_OUT.glob("*.json"):
            try:
                all_patches.append(json.loads(f.read_text(encoding="utf-8")))
            except json.JSONDecodeError:
                pass
        write_manifest(all_patches)
        rebuild_champion_histories(all_patches)

    print(f"Done. Enriched {ok}/{len(pending)}.")
    return 0 if ok == len(pending) else 2


if __name__ == "__main__":
    raise SystemExit(main())
