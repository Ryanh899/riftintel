"""Parse League wiki patch-note / champion-history wikitext into structured changes."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Literal

Direction = Literal["buff", "nerf", "adjust", "rework", "new", "remove", "bugfix"]


@dataclass
class AbilityBlock:
    ability: str
    title: str | None = None
    lines: list[str] = field(default_factory=list)


@dataclass
class EntityBlock:
    name: str
    kind: Literal["champion", "item", "system", "rune"]
    header_note: str | None = None
    abilities: list[AbilityBlock] = field(default_factory=list)
    raw_lines: list[str] = field(default_factory=list)


@dataclass
class PatchMeta:
    version: str
    title: str
    release_date: str | None
    caption: str | None
    highlights: list[str]
    prev: str | None
    next: str | None
    source_url: str | None


TEMPLATE_CI = re.compile(r"\{\{ci\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
TEMPLATE_II = re.compile(r"\{\{ii\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
TEMPLATE_RI = re.compile(r"\{\{ri\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
TEMPLATE_UI = re.compile(r"\{\{ui\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
TEMPLATE_AI = re.compile(r"\{\{ai\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
TEMPLATE_CSL = re.compile(r"\{\{csl\|([^}|]+)\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
SBC = re.compile(r"\{\{sbc\|([^}]+)\}\}", re.I)
FD = re.compile(r"\{\{fd\|([^}]+)\}\}", re.I)
AS_TMPL = re.compile(r"\{\{as\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
STI = re.compile(r"\{\{sti\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
TIP = re.compile(r"\{\{tip\|([^}|]+)(?:\|[^}]*)?\}\}", re.I)
TT = re.compile(r"\{\{tt\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
GOLD = re.compile(r"\{\{g\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
RANGE_DISPLAY = re.compile(r"\{\{rd\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
CAI = re.compile(r"\{\{cai\|([^}|]+)\|([^}|]+)(?:\|[^{}]*)?\}\}", re.I)
GENERIC_TMPL = re.compile(r"\{\{[^{}]*\}\}")
LINK = re.compile(r"\[\[(?:[^|\]]*\|)?([^\]]+)\]\]")
BOLD = re.compile(r"'{2,}")
HTML = re.compile(r"<[^>]+>")


def _eval_num(expr: str) -> str:
    """Evaluate simple numeric expressions like 50*1.5 → 75."""
    expr = expr.strip()
    if re.fullmatch(r"-?\d+", expr):
        return expr
    if re.fullmatch(r"-?\d+\.\d+", expr):
        v = float(expr)
        return str(int(v)) if v == int(v) else f"{v:g}"
    if re.fullmatch(r"-?\d+(?:\.\d+)?\s*\*\s*-?\d+(?:\.\d+)?", expr):
        a, b = re.split(r"\s*\*\s*", expr)
        v = float(a) * float(b)
        return str(int(v)) if v == int(v) else f"{v:g}"
    return expr


def _format_value_span(seg: str) -> str:
    """Turn a pp/ap value segment into a readable range."""
    seg = seg.strip()
    if not seg:
        return ""

    # "10 to 40 for 7" or "10 to 40"
    m = re.match(
        r"^([\d.*+\-]+)\s+to\s+([\d.*+\-]+)(?:\s+for\s+(\d+))?$",
        seg,
        re.I,
    )
    if m:
        a, b = _eval_num(m.group(1)), _eval_num(m.group(2))
        return f"{a}–{b}"

    # semicolon list: 12;17;23 or mixed "50;50 to 100 for 11;100"
    if ";" in seg:
        parts = [p.strip() for p in seg.split(";") if p.strip()]
        nums: list[str] = []
        for p in parts:
            if " to " in p.lower():
                nums.append(_format_value_span(p))
            else:
                nums.append(_eval_num(p))
        # Flatten to first–last numeric if possible
        flat = re.findall(r"-?\d+(?:\.\d+)?", " ".join(nums))
        if len(flat) >= 2:
            return f"{flat[0]}–{flat[-1]}"
        return nums[0] if nums else seg

    return _eval_num(seg)


def expand_ap_inner(inner: str) -> str:
    """
    Expand {{ap|...}} bodies.
    Examples:
      60 to 140          → 60–140
      125 to 275 3       → 125–275 (3 ranks)   # space-rank form
      150 to 350|3       → 150–350 (3 ranks)
      60;90;120;150;180  → 60–180
    """
    # Drop named params
    chunks = [c.strip() for c in inner.split("|") if c.strip() and "=" not in c]
    if not chunks:
        return inner.strip()

    main = chunks[0]
    ranks: str | None = None

    # Space-separated trailing rank: "125 to 275 3"
    m = re.match(r"^(.+?)\s+(\d{1,2})$", main)
    if m and " to " in m.group(1).lower():
        main = m.group(1)
        ranks = m.group(2)
    elif len(chunks) > 1 and re.fullmatch(r"\d{1,2}", chunks[1]):
        ranks = chunks[1]

    text = _format_value_span(main)
    if ranks:
        text = f"{text} ({ranks} ranks)"
    return text


def expand_pp_inner(inner: str) -> str:
    """
    Expand {{pp|...}} level/stat scaling to a readable range.
    Prefer concrete numbers over placeholders.
    """
    raw = inner
    formula_m = re.search(r"\|formula=([^|]+)", raw, re.I)
    formula = formula_m.group(1).strip() if formula_m else None
    type_m = re.search(r"\|type=([^|]+)", raw, re.I)
    scale_type = re.sub(r"'+", "", type_m.group(1)).strip() if type_m else None

    # key=% → values are percentages; key1=% → the scaling axis is % (e.g. crit)
    is_pct = bool(re.search(r"(?:^|\|)key=%(?:\||$)", raw, re.I))

    # Strip named parameters; keep positional segments
    stripped = re.sub(
        r"\|(?:type|label\d*|key\d*|color|formula|displayformula|showtype)=[^|]*",
        "",
        "|" + raw,
        flags=re.I,
    )
    segs = [s.strip() for s in stripped.split("|") if s.strip() and "=" not in s]

    if not segs:
        if formula:
            return formula[:90]
        return "level-scaled"

    val = _format_value_span(segs[0])
    if is_pct and val and "%" not in val:
        val += "%"

    # Second segment often levels or scaling domain (0 to 100 crit, 1 to 18 levels)
    domain = None
    if len(segs) > 1:
        d = segs[1]
        m = re.match(r"^(\d+)\s+to\s+(\d+|∞)", d, re.I)
        if m:
            end = m.group(2)
            if scale_type and "critical" in scale_type.lower():
                domain = f"0–{end}% crit" if m.group(1) == "0" else f"{m.group(1)}–{end}% crit"
            elif scale_type and "time" in scale_type.lower():
                domain = "by game time"
            elif scale_type and "level" in scale_type.lower():
                domain = f"lv {m.group(1)}–{end}"
            elif m.group(1) in ("0", "1") and end.isdigit() and int(end) <= 18:
                domain = f"lv {m.group(1)}–{end}"
            elif m.group(1) == "0" and end.isdigit():
                domain = f"over {m.group(1)}–{end}"
            else:
                domain = f"{m.group(1)}–{end}"

    if scale_type and "critical" in scale_type.lower() and not domain:
        domain = "by crit chance"
    if scale_type and "missing" in scale_type.lower():
        domain = domain or "by missing HP"
    if scale_type and "game time" in scale_type.lower():
        domain = domain or "by game time"

    if val:
        if domain:
            return f"{val} ({domain})"
        return val

    if formula:
        return formula[:90]
    return "level-scaled"


def _replace_templates(text: str, name: str, expander) -> str:
    """Replace {{name|...}} with balanced braces using expander(inner)."""
    pattern = re.compile(rf"\{{\{{\s*{name}\s*\|", re.I)
    out: list[str] = []
    i = 0
    while True:
        m = pattern.search(text, i)
        if not m:
            out.append(text[i:])
            break
        out.append(text[i : m.start()])
        # balanced scan from m.start()
        j = m.start() + 2
        depth = 1
        n = len(text)
        while j < n and depth:
            if text[j : j + 2] == "{{":
                depth += 1
                j += 2
            elif text[j : j + 2] == "}}":
                depth -= 1
                j += 2
            else:
                j += 1
        body = text[m.start() + 2 : j - 2]  # e.g. ap|60 to 140
        if "|" in body:
            inner = body.split("|", 1)[1]
        else:
            inner = ""
        try:
            out.append(expander(inner))
        except Exception:
            out.append(_format_value_span(inner.split("|")[0]) if inner else "")
        i = j
    return "".join(out)


def clean_wikitext(text: str) -> str:
    """Flatten common LoL wiki templates into readable plain text with real numbers."""
    s = text
    s = SBC.sub(r"\1", s)
    s = FD.sub(r"\1", s)

    # Expand scaling templates BEFORE generic strip
    s = _replace_templates(s, "ap", expand_ap_inner)
    s = _replace_templates(s, "pp", expand_pp_inner)
    s = _replace_templates(s, "ppt", expand_pp_inner)  # rare alias

    s = AS_TMPL.sub(r"\1", s)
    s = STI.sub(r"\1", s)
    s = TIP.sub(r"\1", s)
    s = TT.sub(r"\1", s)
    s = GOLD.sub(r"\1", s)
    s = RANGE_DISPLAY.sub(r"\1", s)
    s = TEMPLATE_CSL.sub(r"\2 \1", s)
    s = TEMPLATE_AI.sub(r"\1", s)
    s = TEMPLATE_CI.sub(r"\1", s)
    s = TEMPLATE_II.sub(r"\1", s)
    s = TEMPLATE_RI.sub(r"\1", s)
    s = TEMPLATE_UI.sub(r"\1", s)
    s = CAI.sub(r"\1 (\2)", s)

    # Remaining simple templates
    for _ in range(6):
        ns = GENERIC_TMPL.sub("", s)
        if ns == s:
            break
        s = ns
    s = LINK.sub(r"\1", s)
    s = HTML.sub("", s)
    s = BOLD.sub("", s)
    s = re.sub(r"\s+", " ", s).strip()
    s = s.replace("'''", "").replace("''", "")
    # Never leave our old placeholder
    s = s.replace("[scaled values]", "level-scaled")
    return s


def parse_infobox(wikitext: str, page_title: str) -> PatchMeta:
    version = page_title[1:] if page_title.startswith("V") else page_title
    caption = None
    release = None
    prev = next_ = None
    source = None
    highlights: list[str] = []

    # Field lines are reliable even when nested templates break brace matching.
    # Use [^\n]* (not .*) so we never spill across lines.
    def field(name: str) -> str | None:
        m = re.search(rf"^\|{re.escape(name)}\s*=\s*([^\n]*)$", wikitext, re.M)
        if not m:
            return None
        val = m.group(1).strip()
        return val or None

    cap_raw = field("Caption")
    if cap_raw and not cap_raw.startswith("|"):
        caption = clean_wikitext(cap_raw)

    rel_raw = field("Release")
    if rel_raw:
        release = normalize_wiki_date(rel_raw)

    prev = field("Prev")
    next_ = field("Next")

    related = field("Related")
    if related:
        rel_link = re.search(r"\[(https?://[^\s\]]+)", related)
        if rel_link:
            source = rel_link.group(1)

    title = f"Patch {version}"
    if caption:
        title = caption[:80] + ("…" if len(caption) > 80 else "")

    return PatchMeta(
        version=version,
        title=title,
        release_date=release,
        caption=caption,
        highlights=highlights,
        prev=prev,
        next=next_,
        source_url=source,
    )


def normalize_wiki_date(raw: str) -> str | None:
    """Best-effort convert wiki dates like 'January 10, 2024' or 'January {{NumberSup|10}}, 2024'."""
    # Unwrap {{NumberSup|15}} → 15 (wiki uses this for ordinal days)
    s = re.sub(r"\{\{NumberSup\|(\d+)\}\}", r"\1", raw, flags=re.I)
    s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    s = re.sub(r"\[\[|\]\]", "", s)
    s = re.sub(r"\s+", " ", s).strip().rstrip(".")
    # Month Day, Year
    m = re.search(
        r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})",
        s,
        re.I,
    )
    if not m:
        return None
    months = {
        "january": 1,
        "february": 2,
        "march": 3,
        "april": 4,
        "may": 5,
        "june": 6,
        "july": 7,
        "august": 8,
        "september": 9,
        "october": 10,
        "november": 11,
        "december": 12,
    }
    mo = months[m.group(1).lower()]
    return f"{int(m.group(3)):04d}-{mo:02d}-{int(m.group(2)):02d}"


def extract_section(wikitext: str, heading: str, level: int = 3) -> str:
    """Extract content under a wiki heading until next same-or-higher heading."""
    marks = "=" * level
    pattern = rf"^{marks}\s*{re.escape(heading)}\s*{marks}\s*$"
    m = re.search(pattern, wikitext, re.M | re.I)
    if not m:
        return ""
    start = m.end()
    # next heading of level <= current
    rest = wikitext[start:]
    next_h = re.search(rf"^\s*={{{1},{level}}}\s*[^=].*?={{{1},{level}}}\s*$", rest, re.M)
    if next_h:
        return rest[: next_h.start()]
    return rest


def _parse_entity_list(section: str, kind: Literal["champion", "item", "system", "rune"]) -> list[EntityBlock]:
    entities: list[EntityBlock] = []
    # Split on ;{{ci|Name}} or ;{{ii|Name}} or ;Name patterns
    if kind == "champion":
        parts = re.split(r"\n;(\{\{ci\|[^}]+\}\}[^\n]*)", section)
    elif kind == "item":
        parts = re.split(r"\n;(\{\{ii\|[^}]+\}\}[^\n]*)", section)
    elif kind == "rune":
        parts = re.split(r"\n;(\{\{ri\|[^}]+\}\}[^\n]*)", section)
    else:
        parts = re.split(r"\n;([^\n]+)", section)

    if len(parts) < 2:
        return entities

    # parts[0] is preamble; then header, body, header, body...
    i = 1
    while i < len(parts):
        header = parts[i].strip()
        body = parts[i + 1] if i + 1 < len(parts) else ""
        i += 2

        name = _entity_name_from_header(header, kind)
        if not name:
            continue
        # skip pure skin gallery noise if no real changes
        if TEMPLATE_CSL.search(header) and not body.strip():
            continue

        header_note = None
        if " - " in header:
            header_note = clean_wikitext(header.split(" - ", 1)[1])
        elif "Gameplay Update" in header:
            header_note = "Gameplay Update"

        block = EntityBlock(name=name, kind=kind, header_note=header_note)
        current_ability = AbilityBlock(ability="General", title=None)
        for line in body.splitlines():
            raw = line.rstrip()
            if not raw.strip():
                continue
            # ability / stats headers: * {{ai|...}} or * Stats
            ability_m = re.match(r"^\*\s*(\{\{ai\|[^}]+\}\}|Stats|General|Base stats)\s*$", raw, re.I)
            if ability_m:
                if current_ability.lines:
                    block.abilities.append(current_ability)
                label = ability_m.group(1)
                if label.lower() in ("stats", "base stats"):
                    current_ability = AbilityBlock(ability="Base stats", title=None)
                elif label.lower() == "general":
                    current_ability = AbilityBlock(ability="General", title=None)
                else:
                    ai = TEMPLATE_AI.search(label)
                    if ai:
                        current_ability = AbilityBlock(ability=ai.group(1), title=ai.group(1))
                    else:
                        current_ability = AbilityBlock(
                            ability=clean_wikitext(label)[:40], title=clean_wikitext(label)
                        )
                continue

            # change lines: ** text or *** text
            change_m = re.match(r"^\*{2,}\s*(.+)$", raw)
            if change_m:
                cleaned = clean_wikitext(change_m.group(1))
                if cleaned:
                    current_ability.lines.append(cleaned)
                    block.raw_lines.append(cleaned)
                continue

            # single * lines that are changes not ability headers
            single = re.match(r"^\*\s+(.+)$", raw)
            if single and not re.match(r"^\{\{ai\|", single.group(1)):
                cleaned = clean_wikitext(single.group(1))
                if cleaned:
                    current_ability.lines.append(cleaned)
                    block.raw_lines.append(cleaned)

        if current_ability.lines:
            block.abilities.append(current_ability)

        # drop pure cosmetic skin-only blocks with only bugfixes on skins
        if block.raw_lines or block.header_note:
            entities.append(block)

    return entities


def _entity_name_from_header(header: str, kind: str) -> str | None:
    if kind == "champion":
        m = TEMPLATE_CI.search(header)
        if m:
            return m.group(1).strip()
    if kind == "item":
        m = TEMPLATE_II.search(header)
        if m:
            return m.group(1).strip()
    if kind == "rune":
        m = TEMPLATE_RI.search(header)
        if m:
            return m.group(1).strip()
    # plain name after cleaning
    name = clean_wikitext(header)
    name = re.sub(r"\s*-\s*.*$", "", name).strip()
    return name or None


def parse_patch_page(wikitext: str, page_title: str) -> dict:
    meta = parse_infobox(wikitext, page_title)

    # Prefer Game > Champions hierarchy; fall back to top-level Champions
    game_sec = extract_section(wikitext, "League of Legends V" + meta.version, level=2)
    if not game_sec:
        # try generic
        for h in re.findall(r"^==\s*(.+?)\s*==\s*$", wikitext, re.M):
            if "league of legends" in h.lower() or h.strip().startswith("V"):
                game_sec = extract_section(wikitext, h.strip(), level=2)
                break
    search_root = game_sec or wikitext

    champ_sec = extract_section(search_root, "Champions", level=3) or extract_section(
        wikitext, "Champions", level=3
    )
    item_sec = extract_section(search_root, "Items", level=3) or extract_section(
        wikitext, "Items", level=3
    )
    rune_sec = extract_section(search_root, "Runes", level=3) or extract_section(
        wikitext, "Runes", level=3
    )

    # systems: monsters, turrets, neutral buffs, map, etc.
    system_sections = []
    for name in (
        "Monsters",
        "Turrets",
        "Neutral buffs",
        "Summoner's Rift",
        "Dragon",
        "Baron",
        "Jungle",
        "Systems",
        "Objectives",
    ):
        sec = extract_section(search_root, name, level=3) or extract_section(
            wikitext, name, level=3
        )
        if sec.strip():
            system_sections.append((name, sec))

    champions = _parse_entity_list(champ_sec, "champion")
    items = _parse_entity_list(item_sec, "item")
    runes = _parse_entity_list(rune_sec, "rune")

    systems: list[EntityBlock] = []
    for name, sec in system_sections:
        # treat whole section as one system entity if not itemized
        lines = []
        for line in sec.splitlines():
            m = re.match(r"^\*{1,3}\s+(.+)$", line)
            if m:
                cleaned = clean_wikitext(m.group(1))
                if cleaned and len(cleaned) > 3:
                    lines.append(cleaned)
        if lines:
            systems.append(
                EntityBlock(
                    name=name,
                    kind="system",
                    abilities=[AbilityBlock(ability="System", lines=lines)],
                    raw_lines=lines,
                )
            )
        # also try nested entities
        nested = _parse_entity_list(sec, "system")
        for n in nested:
            if n.name.lower() != name.lower():
                systems.append(n)

    return {
        "meta": meta,
        "champions": champions,
        "items": items,
        "runes": runes,
        "systems": systems,
    }


# Direction heuristics from change language
BUFF_PATTERNS = [
    r"\bincreased\b",
    r"\bimproved\b",
    r"\bbuff(?:ed|s)?\b",
    r"\bnow (?:also )?(?:deals|grants|gains|heals|shields)",
    r"\bcooldown reduced\b",
    r"\bcost reduced\b",
    r"\bmana cost reduced\b",
    r"\brange increased\b",
    r"\bduration increased\b",
    r"\bdamage increased\b",
    r"\bshield increased\b",
    r"\bheal(?:ing)? increased\b",
    r"\bhealth increased\b",
    r"\barmor increased\b",
    r"\bMR increased\b",
    r"\bmovement speed increased\b",
    r"\bnew effect\b",
]
NERF_PATTERNS = [
    r"\breduced\b",
    r"\bdecreased\b",
    r"\bnerf(?:ed|s)?\b",
    r"\bcooldown increased\b",
    r"\bcost increased\b",
    r"\bmana cost increased\b",
    r"\brange reduced\b",
    r"\bduration reduced\b",
    r"\bremoved\b",
    r"\bno longer\b",
]
BUGFIX_PATTERNS = [
    r"\bbug fix\b",
    r"\bfixed\b",
    r"\bundocumented\b",
]
REWORK_PATTERNS = [
    r"\brework\b",
    r"\bgameplay update\b",
    r"\bupdate\b",
    r"\breworked\b",
]


def classify_lines(lines: list[str], header_note: str | None = None) -> Direction:
    text = " ".join(lines).lower()
    note = (header_note or "").lower()
    if any(re.search(p, note) for p in REWORK_PATTERNS):
        return "rework"
    if lines and all(any(re.search(p, ln.lower()) for p in BUGFIX_PATTERNS) for ln in lines):
        return "bugfix"
    if not lines and "gameplay update" in note:
        return "rework"

    buff_hits = sum(1 for p in BUFF_PATTERNS if re.search(p, text))
    nerf_hits = sum(1 for p in NERF_PATTERNS if re.search(p, text))
    # refined: count per-line
    b = n = 0
    for ln in lines:
        low = ln.lower()
        if any(re.search(p, low) for p in BUGFIX_PATTERNS):
            continue
        is_buff = any(re.search(p, low) for p in BUFF_PATTERNS)
        is_nerf = any(re.search(p, low) for p in NERF_PATTERNS)
        # cooldown reduced = buff; damage reduced = nerf already covered
        if re.search(r"cooldown reduced|cost reduced|mana cost reduced", low):
            is_buff, is_nerf = True, False
        if re.search(r"cooldown increased|cost increased|mana cost increased", low):
            is_buff, is_nerf = False, True
        if is_buff and not is_nerf:
            b += 1
        elif is_nerf and not is_buff:
            n += 1
        elif is_buff and is_nerf:
            b += 0
            n += 0  # mixed line

    if b > 0 and n == 0:
        return "buff"
    if n > 0 and b == 0:
        return "nerf"
    if b > 0 and n > 0:
        return "adjust"
    if any(re.search(p, text) for p in BUGFIX_PATTERNS):
        return "bugfix"
    return "adjust"


def severity_from_lines(lines: list[str], direction: Direction) -> int:
    if direction == "rework":
        return 3
    n = len([ln for ln in lines if not any(re.search(p, ln.lower()) for p in BUGFIX_PATTERNS)])
    if n >= 6:
        return 3
    if n >= 3:
        return 2
    return 1


def heuristic_tldr(name: str, lines: list[str], direction: Direction, header_note: str | None) -> str:
    balance = [
        ln
        for ln in lines
        if not any(re.search(p, ln.lower()) for p in BUGFIX_PATTERNS)
    ]
    if header_note and "gameplay update" in header_note.lower():
        prefix = f"{name} gameplay update: "
    else:
        prefix = ""
    if not balance:
        if lines:
            return prefix + (lines[0][:160] + ("…" if len(lines[0]) > 160 else ""))
        return prefix + f"{direction.capitalize()} — see details."
    # Take up to 2 densest lines
    picks = balance[:2]
    joined = "; ".join(picks)
    if len(joined) > 220:
        joined = joined[:217] + "…"
    return prefix + joined


def parse_before_after(line: str) -> dict | None:
    """Extract 'X to Y from Z' patterns into structured before/after."""
    # "Base damage increased to 80 from 60"
    m = re.search(
        r"(.+?)\s+(?:increased|reduced|decreased|changed)\s+to\s+(.+?)\s+from\s+(.+?)(?:\.(?=\s|$)|$)",
        line,
        re.I,
    )
    if m:
        label = m.group(1).strip(" :.-")
        return {
            "label": label[:80],
            "after": m.group(2).strip().rstrip("."),
            "before": m.group(3).strip().rstrip("."),
        }
    # "Base damage increased to 80 / 100 from 60 / 80"
    return None
