from __future__ import annotations

import unittest
from unittest.mock import patch

from patch_versions import next_patch_title_candidates


class NextPatchCandidateTests(unittest.TestCase):
    @patch("patch_versions.date")
    def test_probes_sequential_modern_versions(self, mocked_date) -> None:
        mocked_date.today.return_value.year = 2026
        self.assertEqual(
            next_patch_title_candidates(["26.14", "26.15"]),
            ["V26.16", "V26.17", "V26.18", "V26.19"],
        )

    @patch("patch_versions.date")
    def test_probes_new_season_when_year_rolls_over(self, mocked_date) -> None:
        mocked_date.today.return_value.year = 2027
        self.assertEqual(
            next_patch_title_candidates(["26.24"]),
            ["V27.1", "V27.2", "V27.3", "V27.4"],
        )

    def test_ignores_legacy_and_seasonal_ids(self) -> None:
        self.assertEqual(next_patch_title_candidates(["14.24", "25.S1.3"]), [])


if __name__ == "__main__":
    unittest.main()
