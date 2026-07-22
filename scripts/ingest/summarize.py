"""
Free summarization for patch ingest.

1) Rule-based TL;DR from actual change lines (always accurate, $0).
2) Optional Ollama — **one call per patch** for gameplay blurbs ($0, local).
   Never charged per website visitor; results are stored in static JSON.
"""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from typing import Any

from parse_wikitext import Direction, heuristic_tldr


DEFAULT_OLLAMA = "http://127.0.0.1:11434"
DEFAULT_MODEL = "llama3.1:8b"


def ollama_available(base: str = DEFAULT_OLLAMA) -> bool:
    try:
        with urllib.request.urlopen(f"{base}/api/tags", timeout=2) as r:
            return r.status == 200
    except Exception:
        return False


def ollama_generate(
    prompt: str,
    *,
    model: str = DEFAULT_MODEL,
    base: str = DEFAULT_OLLAMA,
    temperature: float = 0.2,
    num_predict: int = 900,
    timeout: int = 180,
) -> str | None:
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": temperature, "num_predict": num_predict},
    }
    req = urllib.request.Request(
        f"{base}/api/generate",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return (data.get("response") or "").strip() or None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as e:
        print(f"  ollama error: {e}")
        return None


def fallback_impact(name: str, direction: Direction, lines: list[str]) -> str:
    if direction == "bugfix":
        return f"Quality-of-life / bug fixes for {name}; power level should stay similar."
    if direction == "rework":
        return (
            f"{name} plays differently after this update — relearn power spikes and "
            "matchups before grinding ranked."
        )
    if direction == "buff":
        return (
            f"{name} is stronger on paper. Expect a higher presence until the meta adapts; "
            "good time to learn or re-pick them."
        )
    if direction == "nerf":
        return (
            f"{name} loses power in the listed areas. Mains should adjust builds/play patterns; "
            "counters get an easier time."
        )
    return (
        f"{name} was adjusted in mixed directions. Net power depends on playstyle — "
        "read the numbers before assuming a free buff or hard nerf."
    )


def clean_ai(text: str) -> str:
    t = text.strip().strip('"').strip("'")
    t = re.sub(r"^(gameplay impact|summary)\s*:\s*", "", t, flags=re.I)
    # Drop "Name |" or "Name -" prefixes models sometimes emit
    t = re.sub(r"^[A-Za-z][A-Za-z0-9' .\-]{0,30}\s*[|\-–:]\s*", "", t, count=1)
    # Drop markdown list markers
    t = re.sub(r"^[\*\-•]\s*", "", t)
    parts = re.split(r"(?<=[.!?])\s+", t)
    t = " ".join(parts[:3])
    if len(t) > 420:
        t = t[:417] + "…"
    return t


def batch_gameplay_impacts(
    entities: list[dict[str, Any]],
    *,
    version: str,
    model: str = DEFAULT_MODEL,
) -> dict[str, str]:
    """
    One Ollama call for the whole patch.
    Returns map of entity id/name → gameplay impact string.
    """
    if not entities:
        return {}

    lines_out = []
    for i, e in enumerate(entities[:40], 1):  # cap prompt size
        bullets = e.get("lines") or []
        bullet_txt = "; ".join(bullets[:4])
        lines_out.append(
            f"{i}. {e['name']} [{e['type']}] ({e['direction']}): {e['tldr']}\n"
            f"   Details: {bullet_txt}"
        )

    prompt = f"""You are a League of Legends balance analyst. Be accurate and concise.
Do NOT invent numbers. No marketing fluff. Patch {version}.

For EACH numbered entity, write exactly one line in this format:
N|one or two sentences about ranked/gameplay impact

Entities:
{chr(10).join(lines_out)}

Output only the N|sentence lines, nothing else.
"""

    raw = ollama_generate(prompt, model=model, num_predict=1200, timeout=240)
    if not raw:
        return {}

    out: dict[str, str] = {}
    for line in raw.splitlines():
        line = line.strip()
        m = re.match(r"^(\d+)\s*[|.:)\-]\s*(.+)$", line)
        if not m:
            continue
        idx = int(m.group(1)) - 1
        if 0 <= idx < len(entities):
            key = entities[idx]["id"]
            out[key] = clean_ai(m.group(2))
    return out


def batch_patch_summary(
    version: str,
    caption: str | None,
    entity_blurbs: list[str],
    *,
    model: str = DEFAULT_MODEL,
) -> str | None:
    sample = "\n".join(f"- {b}" for b in entity_blurbs[:35])
    prompt = f"""Summarize League of Legends patch {version} for everyday players in 2-3 plain sentences.
ONLY use champions/items listed below. Do not invent other changes. No bullet lists. No fluff.

Official caption: {caption or "n/a"}

Key changes:
{sample}

Write the summary now:"""
    ai = ollama_generate(prompt, model=model, num_predict=220, timeout=120)
    return clean_ai(ai) if ai else None


def summarize_entity_local(
    name: str,
    direction: Direction,
    lines: list[str],
    header_note: str | None,
) -> dict[str, str]:
    tldr = heuristic_tldr(name, lines, direction, header_note)
    return {
        "tldr": tldr,
        "gameplayImpact": fallback_impact(name, direction, lines),
    }


def summarize_patch_local(version: str, caption: str | None, entity_blurbs: list[str]) -> str:
    if not entity_blurbs:
        return caption or f"Patch {version} notes."
    return (
        (caption + " " if caption else "")
        + f"Structured changes across {len(entity_blurbs)} entities this patch."
    ).strip()
