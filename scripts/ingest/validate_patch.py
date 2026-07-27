"""Quality gate for patch JSON before it can be published by RiftIntel."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


UNRESOLVED_MARKUP = re.compile(r"\{\{|\}\}|\[\[|\]\]")
MISSING_TRANSITION_VALUE = re.compile(
    r"\b(?:increased|decreased|reduced|changed)\s+to\s*(?:from\b|[.!]?$)"
    r"|\bfrom\s*(?:[.!]|$)",
    re.IGNORECASE,
)
INCOMPLETE_RECIPE = re.compile(r"(?:\+\s*)?=\s*[.!]?$")
NUMBER = re.compile(r"-?\d+(?:\.\d+)?%?")


@dataclass(frozen=True)
class ValidationIssue:
    code: str
    path: str
    message: str
    value: str | None = None


def _visible_strings(entity: dict[str, Any], root: str) -> Iterable[tuple[str, str]]:
    for key in ("name", "tldr", "gameplayImpact", "context"):
        value = entity.get(key)
        if isinstance(value, str):
            yield f"{root}.{key}", value

    for change_index, change in enumerate(entity.get("changes") or []):
        change_root = f"{root}.changes[{change_index}]"
        for key in ("ability", "title"):
            value = change.get(key)
            if isinstance(value, str):
                yield f"{change_root}.{key}", value
        for line_index, line in enumerate(change.get("lines") or []):
            line_root = f"{change_root}.lines[{line_index}]"
            for key in ("label", "before", "after", "delta", "note"):
                value = line.get(key)
                if isinstance(value, str):
                    yield f"{line_root}.{key}", value


def _numbers(value: str) -> set[str]:
    return set(NUMBER.findall(value.replace("–", "-")))


def _contradiction_issues(entity: dict[str, Any], root: str) -> list[ValidationIssue]:
    """Catch summaries that disagree with the structured row they describe."""
    issues: list[ValidationIssue] = []
    summary = str(entity.get("tldr") or "")
    summary_lower = summary.lower()
    if not summary:
        return issues

    for change_index, change in enumerate(entity.get("changes") or []):
        for line_index, line in enumerate(change.get("lines") or []):
            label = str(line.get("label") or "").strip()
            before = str(line.get("before") or "").strip()
            after = str(line.get("after") or "").strip()
            if not label or not before or not after:
                continue
            if label.lower() not in summary_lower:
                continue

            expected = _numbers(before) | _numbers(after)
            if expected and not expected.issubset(_numbers(summary)):
                path = f"{root}.changes[{change_index}].lines[{line_index}]"
                issues.append(
                    ValidationIssue(
                        code="summary_value_mismatch",
                        path=path,
                        message="Structured before/after values disagree with the entity summary.",
                        value=f"{label}: {before} -> {after} | {summary}",
                    )
                )
    return issues


def validate_patch(patch: dict[str, Any]) -> list[ValidationIssue]:
    """Return publication-blocking issues found in one patch."""
    issues: list[ValidationIssue] = []

    for key in ("id", "version", "releaseDate", "champions", "items", "systems"):
        if key not in patch:
            issues.append(
                ValidationIssue(
                    code="missing_required_field",
                    path=key,
                    message=f"Patch is missing required field '{key}'.",
                )
            )

    patch_id = str(patch.get("id") or "")
    if not re.fullmatch(r"\d{2}\.(?:\d{1,2}|S\d\.\d)", patch_id):
        issues.append(
            ValidationIssue(
                code="invalid_patch_id",
                path="id",
                message="Patch id does not match a supported Riot patch version.",
                value=patch_id,
            )
        )

    seen_ids: set[tuple[str, str]] = set()
    for collection in ("champions", "items", "systems"):
        entities = patch.get(collection)
        if not isinstance(entities, list):
            continue
        for entity_index, entity in enumerate(entities):
            root = f"{collection}[{entity_index}]"
            if not isinstance(entity, dict):
                issues.append(
                    ValidationIssue(
                        code="invalid_entity",
                        path=root,
                        message="Entity must be an object.",
                    )
                )
                continue

            identity = (collection, str(entity.get("id") or ""))
            if not identity[1]:
                issues.append(
                    ValidationIssue(
                        code="missing_entity_id",
                        path=f"{root}.id",
                        message="Entity is missing an id.",
                    )
                )
            elif identity in seen_ids:
                issues.append(
                    ValidationIssue(
                        code="duplicate_entity",
                        path=f"{root}.id",
                        message="Patch contains the same entity more than once.",
                        value=identity[1],
                    )
                )
            seen_ids.add(identity)

            changes = entity.get("changes")
            if not isinstance(changes, list) or not changes:
                issues.append(
                    ValidationIssue(
                        code="missing_changes",
                        path=f"{root}.changes",
                        message="Entity has no structured or textual change lines.",
                    )
                )

            for path, value in _visible_strings(entity, root):
                if UNRESOLVED_MARKUP.search(value):
                    issues.append(
                        ValidationIssue(
                            code="unresolved_wiki_markup",
                            path=path,
                            message="Visible text contains unresolved wiki markup.",
                            value=value[:240],
                        )
                    )
                if MISSING_TRANSITION_VALUE.search(value):
                    issues.append(
                        ValidationIssue(
                            code="missing_transition_value",
                            path=path,
                            message="A before/after statement is missing a value.",
                            value=value[:240],
                        )
                    )
                if "recipe" in value.lower() and INCOMPLETE_RECIPE.search(value.strip()):
                    issues.append(
                        ValidationIssue(
                            code="incomplete_recipe",
                            path=path,
                            message="Item recipe is incomplete.",
                            value=value[:240],
                        )
                    )

            issues.extend(_contradiction_issues(entity, root))

    unique: dict[tuple[str, str, str | None], ValidationIssue] = {}
    for issue in issues:
        unique[(issue.code, issue.path, issue.value)] = issue
    return list(unique.values())


def write_quarantine(
    patch: dict[str, Any],
    issues: list[ValidationIssue],
    quarantine_dir: Path,
) -> Path:
    """Persist rejected input away from the app's by-id publication directory."""
    quarantine_dir.mkdir(parents=True, exist_ok=True)
    patch_id = str(patch.get("id") or "unknown")
    destination = quarantine_dir / f"{patch_id}.json"
    payload = {
        "quarantinedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "patchId": patch_id,
        "issueCount": len(issues),
        "issues": [asdict(issue) for issue in issues],
        "patch": patch,
    }
    destination.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return destination

