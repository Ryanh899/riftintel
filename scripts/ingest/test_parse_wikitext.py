from __future__ import annotations

import unittest

from parse_wikitext import clean_wikitext, parse_before_after


class CleanWikitextTests(unittest.TestCase):
    def test_preserves_decimal_transition_values(self) -> None:
        parsed = parse_before_after("Armor growth increased to 5.2 from 4.7.")
        self.assertEqual(
            parsed,
            {"label": "Armor growth", "after": "5.2", "before": "4.7"},
        )

    def test_expands_patch_2615_value_templates(self) -> None:
        self.assertEqual(
            clean_wikitext("Total cost reduced to {{g|3000}} from {{g|3200}}."),
            "Total cost reduced to 3000 from 3200.",
        )
        self.assertEqual(
            clean_wikitext(
                "Shaped Charge base damage increased to {{rd|50|25}} from {{rd|30|15}}."
            ),
            "Shaped Charge base damage increased to 50 from 30.",
        )

    def test_flattens_entity_templates_without_leaking_braces(self) -> None:
        source = (
            "{{ai|Void Surge|Bel'Veth}} and {{cai|Rebuttal|Mel}}; "
            "{{ci|Nidalee}} with {{tt|125 range|tooltip}} and {{ui|Rift Scuttler}}."
        )
        self.assertEqual(
            clean_wikitext(source),
            "Void Surge and Rebuttal (Mel); Nidalee with 125 range and Rift Scuttler.",
        )

    def test_uses_scaling_template_value_not_metadata(self) -> None:
        self.assertEqual(clean_wikitext("{{as|12%|AD}}"), "12%")


if __name__ == "__main__":
    unittest.main()
