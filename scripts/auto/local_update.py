#!/usr/bin/env python3
"""
Local auto-update (your PC + Ollama).

1) Ingest any NEW wiki patches (with --ai if Ollama is up)
2) Enrich any cloud-ingested patches still missing AI
3) Optional: git commit + push so Vercel deploys

Usage:
  python scripts/auto/local_update.py
  python scripts/auto/local_update.py --push
  python scripts/auto/local_update.py --push --years 0.35

Schedule with Windows Task Scheduler every 30–60 min while you're online.
On known patch days, leave the PC on with Ollama running.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INGEST = ROOT / "scripts" / "ingest" / "run_ingest.py"
ENRICH = ROOT / "scripts" / "ingest" / "enrich_ai.py"


def run(cmd: list[str], check: bool = True) -> int:
    print("+", " ".join(cmd))
    r = subprocess.run(cmd, cwd=ROOT)
    if check and r.returncode != 0:
        raise SystemExit(r.returncode)
    return r.returncode


def git_has_changes() -> bool:
    r = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    return bool(r.stdout.strip())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", type=float, default=0.4, help="How far back to scan for new patches")
    ap.add_argument("--push", action="store_true", help="git commit + push if data changed")
    ap.add_argument("--model", default="llama3.1:8b")
    ap.add_argument("--no-ai", action="store_true", help="Skip Ollama even if available")
    args = ap.parse_args()

    sys.path.insert(0, str(ROOT / "scripts" / "ingest"))
    from summarize import ollama_available

    use_ai = (not args.no_ai) and ollama_available()
    if use_ai:
        print("Ollama: available — new patches will get AI blurbs")
    else:
        print("Ollama: not available — structure-only; AI pending for later enrich")

    ingest_cmd = [
        sys.executable,
        str(INGEST),
        "--years",
        str(args.years),
        "--only-new",
    ]
    if use_ai:
        ingest_cmd += ["--ai", "--model", args.model]
    run(ingest_cmd)

    # Fill AI for anything cloud left behind (or this run without Ollama)
    if use_ai:
        run([sys.executable, str(ENRICH), "--model", args.model], check=False)
    else:
        print("Skip enrich_ai (Ollama down). Cloud/heuristic data stays until next local run.")

    if not args.push:
        print("Done (no --push). Review git status and push when ready.")
        return 0

    if not git_has_changes():
        print("No data changes to commit.")
        return 0

    run(["git", "add", "src/data"])
    # Allow empty? no
    msg = "data: auto-update patch notes"
    r = subprocess.run(
        ["git", "commit", "-m", msg],
        cwd=ROOT,
    )
    if r.returncode != 0:
        print("Commit skipped or failed (maybe nothing staged).")
        return 0

    run(["git", "push"])
    print("Pushed — host should redeploy.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
