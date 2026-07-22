#!/usr/bin/env python3
"""Build champion/item name maps from latest Data Dragon for image resolution."""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "assets"


def main() -> None:
    versions = json.load(
        urllib.request.urlopen(
            "https://ddragon.leagueoflegends.com/api/versions.json"
        )
    )
    ver = versions[0]
    print("version", ver)

    ch = json.load(
        urllib.request.urlopen(
            f"https://ddragon.leagueoflegends.com/cdn/{ver}/data/en_US/champion.json"
        )
    )
    items = json.load(
        urllib.request.urlopen(
            f"https://ddragon.leagueoflegends.com/cdn/{ver}/data/en_US/item.json"
        )
    )

    champ_map: dict[str, str] = {}
    for key, v in ch["data"].items():
        name = v["name"]
        variants = {
            name.lower(),
            key.lower(),
            name.lower().replace("'", "").replace(".", "").replace(" ", ""),
            name.lower().replace(" & ", " ").replace("&", ""),
        }
        for n in variants:
            champ_map[n] = key

    # Manual aliases for forms / wiki names
    aliases = {
        "wukong": "MonkeyKing",
        "monkey king": "MonkeyKing",
        "mega gnar": "Gnar",
        "kled & skaarl": "Kled",
        "kled and skaarl": "Kled",
        "nunu": "Nunu",
        "nunu willump": "Nunu",
        "renata": "Renata",
        "jarvan": "JarvanIV",
        "belveth": "Belveth",
        "cho gath": "Chogath",
        "kai sa": "Kaisa",
        "kha zix": "Khazix",
        "kog maw": "KogMaw",
        "rek sai": "RekSai",
        "vel koz": "Velkoz",
        "lee sin": "LeeSin",
        "master yi": "MasterYi",
        "miss fortune": "MissFortune",
        "twisted fate": "TwistedFate",
        "tahm kench": "TahmKench",
        "xin zhao": "XinZhao",
        "dr mundo": "DrMundo",
        "aurelion sol": "AurelionSol",
    }
    for a, k in aliases.items():
        champ_map[a] = k

    item_map: dict[str, str] = {}
    for iid, v in items["data"].items():
        if int(iid) >= 220000:
            continue
        name = v["name"].lower()
        gold = v.get("gold", {}).get("total", 0)
        prev = item_map.get(name)
        if not prev or gold >= int(prev.split(":")[1] if ":" in prev else 0):
            item_map[name] = f"{iid}:{gold}"

    item_map = {k: v.split(":")[0] for k, v in item_map.items()}

    # Common renamed / alias items
    item_aliases = {
        "navori quickblades": "6675",  # may be Navori Flickerblade now
        "slightly magical boots": "2422",
        "ludens companion": None,
        "luden's companion": None,
        "luden's echo": "6655",
    }
    # resolve by partial name search
    for want in ("navori", "luden", "magical boot"):
        for name, iid in item_map.items():
            if want in name:
                print("  found", name, iid)

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "ddragon-version.json").write_text(
        json.dumps({"version": ver}, indent=2), encoding="utf-8"
    )
    (OUT / "champion-keys.json").write_text(
        json.dumps(champ_map, indent=2, sort_keys=True), encoding="utf-8"
    )
    (OUT / "item-ids.json").write_text(
        json.dumps(item_map, indent=2, sort_keys=True), encoding="utf-8"
    )
    print("wrote", len(champ_map), "champ keys,", len(item_map), "items")


if __name__ == "__main__":
    main()
