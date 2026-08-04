"""Patch-version helpers that do not require network dependencies."""

from __future__ import annotations

import re
from datetime import date


def next_patch_title_candidates(existing_ids: list[str], count: int = 4) -> list[str]:
    """Return likely upcoming wiki pages without relying on the wiki page index.

    MediaWiki's all-pages listing can lag or be cached when Riot publishes a patch.
    Directly probing a few sequential versions keeps scheduled ingestion reliable.
    Missing pages are never cached, so they can be found on the next run.
    """
    numeric: list[tuple[int, int]] = []
    for patch_id in existing_ids:
        match = re.fullmatch(r"(\d{2})\.(\d{1,2})", patch_id)
        if match and int(match.group(1)) >= 25:
            numeric.append((int(match.group(1)), int(match.group(2))))

    if not numeric:
        return []

    major, minor = max(numeric)
    current_major = date.today().year - 2000
    candidates: list[str] = []
    if current_major > major:
        candidates.extend(f"V{current_major}.{n}" for n in range(1, count + 1))

    candidates.extend(f"V{major}.{minor + n}" for n in range(1, count + 1))
    return list(dict.fromkeys(candidates))[:count]
