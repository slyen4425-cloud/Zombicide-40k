#!/usr/bin/env python3
"""Read-only post-R09 metadata inventory guards; no R09 source required for tests."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from gensrpg_phase12_r06_source_inventory import git_blob
from gensrpg_phase12_post_r09_exit_census import (
    EXPECTED_BLOB, EXPECTED_SIZE, CERTIFIED_COMMIT, summarize, main
)

SAMPLE = b"""<!doctype html>
<script id="dungeonCore01">const secret_dungeon='do-not-publish';</script>
<script>const hidden_bootstrap='do-not-publish-2';</script>
<script src="assets/gensrpg/survival/entry-v1.js"></script>
<script type="application/x-gensrpg-disabled">legacy_inert_dont_publish()</script>
<script type="application/json">{"private":"no-copy"}</script>
"""


class CensusTests(unittest.TestCase):
    def test_exact_r09_gate_rejects_any_unverified_source(self):
        with self.assertRaisesRegex(ValueError, "Source hors checkpoint R09"):
            summarize(SAMPLE)
        self.assertEqual(EXPECTED_SIZE, 2093066)
        self.assertEqual(EXPECTED_BLOB, "4dbe3314d5048f2def404ed674498c0670c04fc1")
        self.assertEqual(len(CERTIFIED_COMMIT), 40)

    def test_synthetic_only_metadata_never_discloses_body(self):
        report = summarize(
            SAMPLE, expected_size=len(SAMPLE), expected_blob=git_blob(SAMPLE)
        )
        counts = report["counts"]
        self.assertEqual(counts["script_tags"], 5)
        self.assertEqual(counts["external"], 1)
        self.assertEqual(counts["inline_active"], 2)
        self.assertEqual(counts["inline_disabled"], 1)
        self.assertEqual(counts["inline_non_js"], 1)
        self.assertEqual(counts["anonymous_inline_active"], 1)
        self.assertEqual(len(report["disabled_inline"]), 1)
        self.assertEqual(
            report["source"]["checkpoint_commit"], "synthetic-test-only"
        )
        output = json.dumps(report)
        for sensitive in (
            "do-not-publish", "legacy_inert_dont_publish", "no-copy"
        ):
            self.assertNotIn(sensitive, output)
        self.assertTrue(report["largest_active_inline"])
        self.assertTrue(report["tiny_inline_under_512_bytes_not_yet_certified_bootstraps"])

    def test_hash_gate_even_for_correct_size(self):
        wrong_source = b"x" * EXPECTED_SIZE
        with self.assertRaisesRegex(ValueError, "Source hors checkpoint R09"):
            summarize(wrong_source)

    def test_zip_is_only_a_transport_not_a_source_override(self):
        with tempfile.TemporaryDirectory() as directory:
            import subprocess
            zip_path = Path(directory) / "wrong.zip"
            with zipfile.ZipFile(zip_path, "w") as archive:
                archive.writestr("index.html", SAMPLE)
            result = subprocess.run(
                [sys.executable, str(ROOT / "tools/gensrpg_phase12_post_r09_exit_census.py"),
                 str(zip_path)], text=True, capture_output=True
            )
            self.assertEqual(result.returncode, 2)
            self.assertIn("R09 EXIT BLOCKED", result.stderr)
            self.assertNotIn("do-not-publish", result.stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
