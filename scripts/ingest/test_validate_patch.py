from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from validate_patch import validate_patch, write_quarantine


def patch_with(line: dict) -> dict:
    return {
        "id": "26.15",
        "version": "26.15",
        "releaseDate": "2026-07-29",
        "champions": [
            {
                "id": "ahri",
                "name": "Ahri",
                "tldr": "Base damage increased to 90 from 80.",
                "gameplayImpact": "More damage.",
                "changes": [
                    {
                        "ability": "Q",
                        "title": "Orb of Deception",
                        "lines": [line],
                    }
                ],
            }
        ],
        "items": [],
        "systems": [],
    }


class ValidatePatchTests(unittest.TestCase):
    def test_accepts_consistent_numeric_change(self) -> None:
        patch = patch_with({"label": "Base damage", "before": "80", "after": "90"})
        self.assertEqual(validate_patch(patch), [])

    def test_rejects_wiki_markup(self) -> None:
        patch = patch_with({"label": "Change", "note": "Now builds into Codex}}."})
        self.assertIn(
            "unresolved_wiki_markup",
            {issue.code for issue in validate_patch(patch)},
        )

    def test_rejects_missing_transition_value(self) -> None:
        patch = patch_with(
            {"label": "Total cost", "note": "Total cost increased to from ."}
        )
        self.assertIn(
            "missing_transition_value",
            {issue.code for issue in validate_patch(patch)},
        )

    def test_rejects_summary_value_mismatch(self) -> None:
        patch = patch_with({"label": "Base damage", "before": "70", "after": "90"})
        self.assertIn(
            "summary_value_mismatch",
            {issue.code for issue in validate_patch(patch)},
        )

    def test_writes_quarantine_envelope(self) -> None:
        patch = patch_with({"label": "Change", "note": "Broken}}"})
        issues = validate_patch(patch)
        with tempfile.TemporaryDirectory() as temp:
            destination = write_quarantine(patch, issues, Path(temp))
            self.assertTrue(destination.exists())
            self.assertIn('"issueCount"', destination.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()

