"""Data Dragon helpers for champion/item name → asset keys (free CDN)."""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json"


def fetch_json(url: str) -> dict | list:
    req = urllib.request.Request(url, headers={"User-Agent": "RiftIntelIngest/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def load_champion_map(cache_dir: Path) -> dict[str, str]:
    """Map lowercase champion name → ddragon id (e.g. 'ahri' -> 'Ahri', \"cho'gath\" -> 'Chogath')."""
    cache = cache_dir / "ddragon_champions.json"
    if cache.exists():
        data = json.loads(cache.read_text(encoding="utf-8"))
    else:
        versions = fetch_json(VERSIONS_URL)
        ver = versions[0]
        data = fetch_json(
            f"https://ddragon.leagueoflegends.com/cdn/{ver}/data/en_US/champion.json"
        )
        cache.write_text(json.dumps(data), encoding="utf-8")

    out: dict[str, str] = {}
    for key, ch in data.get("data", {}).items():
        name = ch.get("name", key)
        out[name.lower()] = key
        out[key.lower()] = key
        # common variants
        out[name.lower().replace(" ", "").replace("'", "").replace(".", "")] = key
    # manual aliases
    aliases = {
        "wukong": "MonkeyKing",
        "monkey king": "MonkeyKing",
        "jarvan iv": "JarvanIV",
        "jarvan": "JarvanIV",
        "lee sin": "LeeSin",
        "master yi": "MasterYi",
        "miss fortune": "MissFortune",
        "twisted fate": "TwistedFate",
        "xin zhao": "XinZhao",
        "aurelion sol": "AurelionSol",
        "tahm kench": "TahmKench",
        "bel'veth": "Belveth",
        "belveth": "Belveth",
        "cho'gath": "Chogath",
        "chogath": "Chogath",
        "kha'zix": "Khazix",
        "khazix": "Khazix",
        "kai'sa": "Kaisa",
        "kaisa": "Kaisa",
        "kog'maw": "KogMaw",
        "kogmaw": "KogMaw",
        "rek'sai": "RekSai",
        "reksai": "RekSai",
        "vel'koz": "Velkoz",
        "velkoz": "Velkoz",
        "nunu & willump": "Nunu",
        "nunu": "Nunu",
        "renata glasc": "Renata",
        "renata": "Renata",
    }
    for a, k in aliases.items():
        out[a] = k
    return out


def load_item_map(cache_dir: Path) -> dict[str, str]:
    cache = cache_dir / "ddragon_items.json"
    if cache.exists():
        data = json.loads(cache.read_text(encoding="utf-8"))
    else:
        versions = fetch_json(VERSIONS_URL)
        ver = versions[0]
        data = fetch_json(
            f"https://ddragon.leagueoflegends.com/cdn/{ver}/data/en_US/item.json"
        )
        cache.write_text(json.dumps(data), encoding="utf-8")

    out: dict[str, str] = {}
    for iid, item in data.get("data", {}).items():
        name = item.get("name", "")
        if name:
            out[name.lower()] = iid
    return out


def champion_key(name: str, cmap: dict[str, str]) -> str | None:
    n = name.lower().strip()
    if n in cmap:
        return cmap[n]
    compact = n.replace(" ", "").replace("'", "").replace(".", "")
    return cmap.get(compact)


def item_key(name: str, imap: dict[str, str]) -> str | None:
    return imap.get(name.lower().strip())
