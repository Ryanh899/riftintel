"""Minimal MediaWiki client for wiki.leagueoflegends.com (free, rate-limited)."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests

API = "https://wiki.leagueoflegends.com/en-us/api.php"
USER_AGENT = "RiftIntelIngest/1.0 (fan analysis tool; local; respectful rate limits)"
MIN_INTERVAL = 0.35  # ~3 req/s max — stay polite


class WikiClient:
    def __init__(self, cache_dir: Path, session: requests.Session | None = None):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.session = session or requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        self._last = 0.0

    def _throttle(self) -> None:
        elapsed = time.time() - self._last
        if elapsed < MIN_INTERVAL:
            time.sleep(MIN_INTERVAL - elapsed)
        self._last = time.time()

    def get(self, params: dict[str, Any], cache_key: str | None = None) -> dict[str, Any]:
        if cache_key:
            path = self.cache_dir / f"{cache_key}.json"
            if path.exists():
                return json.loads(path.read_text(encoding="utf-8"))

        self._throttle()
        r = self.session.get(API, params={**params, "format": "json"}, timeout=60)
        r.raise_for_status()
        data = r.json()
        if cache_key:
            path = self.cache_dir / f"{cache_key}.json"
            path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        return data

    def parse_wikitext(self, page: str, use_cache: bool = True) -> str | None:
        safe = page.replace("/", "_").replace(" ", "_").replace(":", "_")
        cache_key = f"parse_{safe}" if use_cache else None
        data = self.get(
            {"action": "parse", "page": page, "prop": "wikitext", "redirects": 1},
            cache_key=cache_key,
        )
        if "error" in data:
            return None
        return data.get("parse", {}).get("wikitext", {}).get("*")

    def list_pages_with_prefix(self, prefix: str, limit: int = 500) -> list[str]:
        titles: list[str] = []
        cont: str | None = None
        while True:
            params: dict[str, Any] = {
                "action": "query",
                "list": "allpages",
                "apprefix": prefix,
                "aplimit": "max",
                "apfilterredir": "nonredirects",
            }
            if cont:
                params["apcontinue"] = cont
            cache_key = f"allpages_{prefix}_{cont or 'start'}"
            data = self.get(params, cache_key=cache_key)
            batch = data.get("query", {}).get("allpages", [])
            titles.extend(p["title"] for p in batch)
            cont = data.get("continue", {}).get("apcontinue")
            if not cont or len(titles) >= limit:
                break
        return titles
