#!/usr/bin/env python3
"""Metadata-only Phase 12 EXIT inventory regressions. No production HTML loaded."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from gensrpg_phase12_exit_inventory import summarize, EXPECTED_BLOB, EXPECTED_SIZE
from gensrpg_phase12_r06_source_inventory import git_blob

SAMPLE = b"""<html><script id="captureFix200">let token='dont-print-me';</script>
<script>const anonymous='dont-print-me-either';</script>
<script type="application/x-gensrpg-disabled">badInactive()</script>
<script id="dungeonCore201" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script></html>"""


class ExitInventoryTests(unittest.TestCase):
    def test_only_exact_current_r06_source_is_allowed(self):
        with self.assertRaisesRegex(ValueError, "Source hors checkpoint"):
            summarize(SAMPLE)
        self.assertEqual(EXPECTED_SIZE, 2643155)
        self.assertEqual(EXPECTED_BLOB, "12fc91df4ee4c7989a172baa96f9790da6dc57f7")

    def test_current_repo_index_matches_user_d2_zip_census(self):
        source = Path(__file__).resolve().parents[1] / "index.html"
        report = summarize(source.read_bytes())
        counts = report["counts"]
        self.assertEqual(counts["script_tags"], 161)
        self.assertEqual(counts["external"], 55)
        self.assertEqual(counts["inline_active"], 89)
        self.assertEqual(counts["inline_disabled"], 17)
        self.assertEqual(counts["inline_active_bytes"], 1752298)
        self.assertEqual(report["anonymous_inline_active"], {"count": 5, "body_bytes": 1417518})
        largest = report["largest_active_inline"]
        self.assertEqual([(x["order"], x["id"], x["body_bytes"]) for x in largest[:2]],
                         [(19, None, 1229754), (21, None, 180964)])
        self.assertEqual(largest[0]["body_blob"], "a277677ff96eb8bb62dcffcbe84e74f5d255b73a")
        self.assertEqual(largest[1]["body_blob"], "3667baf92d27696569286870403c96d6e5428779")
        self.assertEqual(sum(x["body_bytes"] for x in report["disabled_metadata"]), 95878)

    def test_synthetic_metadata_never_leaks_bodies(self):
        record = summarize(SAMPLE, len(SAMPLE), git_blob(SAMPLE))
        self.assertEqual(record["counts"]["script_tags"], 4)
        self.assertEqual(record["counts"]["external"], 1)
        self.assertEqual(record["counts"]["inline_active"], 2)
        self.assertEqual(record["counts"]["inline_disabled"], 1)
        self.assertEqual(record["anonymous_inline_active"]["count"], 1)
        self.assertEqual(record["grouped_by_identifier_only_not_proven_ownership"]["capture-candidate"]["count"], 1)
        import json
        output = json.dumps(record)
        self.assertNotIn("dont-print-me", output)
        self.assertNotIn("badInactive()", output)


if __name__ == "__main__":
    unittest.main(verbosity=2)
