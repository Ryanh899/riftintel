"""Audit published patch JSON without modifying or deleting source data."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

from ingest.validate_patch import validate_patch


ROOT = Path(__file__).resolve().parents[1]
PATCH_DIR = ROOT / "src" / "data" / "patches" / "by-id"


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit RiftIntel patch data")
    parser.add_argument(
        "--fail",
        action="store_true",
        help="Exit non-zero when publication-blocking issues are found.",
    )
    parser.add_argument(
        "--patch",
        default="",
        help="Audit one patch id instead of the full dataset.",
    )
    args = parser.parse_args()

    files = (
        [PATCH_DIR / f"{args.patch}.json"]
        if args.patch
        else sorted(PATCH_DIR.glob("*.json"))
    )
    missing = [path for path in files if not path.exists()]
    if missing:
        print(f"ERROR: patch file not found: {missing[0]}")
        return 2

    affected: list[tuple[str, list]] = []
    codes: Counter[str] = Counter()
    for path in files:
        patch = json.loads(path.read_text(encoding="utf-8"))
        issues = validate_patch(patch)
        if issues:
            affected.append((path.stem, issues))
            codes.update(issue.code for issue in issues)

    print(
        f"Audited {len(files)} patch files: "
        f"{len(files) - len(affected)} clean, {len(affected)} need review."
    )
    for code, count in codes.most_common():
        print(f"  {code}: {count}")

    for patch_id, issues in affected[:10]:
        print(f"\n{patch_id}: {len(issues)} issue(s)")
        for issue in issues[:5]:
            suffix = f" — {issue.value}" if issue.value else ""
            print(f"  [{issue.code}] {issue.path}{suffix}")
        if len(issues) > 5:
            print(f"  ... {len(issues) - 5} more")
    if len(affected) > 10:
        print(f"\n... {len(affected) - 10} more affected patches")

    return 1 if args.fail and affected else 0


if __name__ == "__main__":
    raise SystemExit(main())

