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

    def test_exact_certified_r09_runtime_matches_user_d8_census_manifest(self):
        """Metadata guard against drift; the source was independently certified from d8.zip."""
        meta = json.loads(
            (ROOT / "docs/GENSRPG_PHASE12_POST_R09_D8_VERIFIED_CENSUS_2026-10-18.json").read_text()
        )
        source = (ROOT / "index.html").read_bytes()
        self.assertEqual(len(source), EXPECTED_SIZE)
        self.assertEqual(git_blob(source), EXPECTED_BLOB)
        current = summarize(source)
        self.assertEqual(current["source"]["checkpoint_commit"], CERTIFIED_COMMIT)
        self.assertEqual(current["counts"]["script_tags"], meta["counts"]["scriptTags"])
        for source_key, manifest_key in [
            ("external", "externalScripts"),
            ("inline_active", "activeInlineScripts"),
            ("inline_active_bytes", "activeInlineBytes"),
            ("inline_disabled", "disabledInlineScripts"),
            ("disabled_body_bytes", "disabledInlineBytes"),
            ("inline_non_js", "nonJsInline"),
            ("anonymous_inline_active", "anonymousActive"),
            ("anonymous_active_bytes", "anonymousActiveBytes"),
            ("named_inline_active", "namedActive"),
            ("named_active_bytes", "namedActiveBytes"),
        ]:
            self.assertEqual(current["counts"][source_key], meta["counts"][manifest_key])
        by_order = {row["order"]: row for row in current["all_scripts_metadata_only"]}
        for item in meta["anonymousActive"]:
            row = by_order[item["ordinal"]]
            self.assertIsNone(row["id"])
            self.assertEqual(row["body_bytes"], item["bytes"])
            self.assertEqual(row["body_blob"], item["blob"])
        self.assertEqual(
            [(row["order"],row["id"],row["body_bytes"])
             for row in current["disabled_inline"]],
            [(row["ordinal"],row["id"],row["bytes"])
             for row in meta["disabledScripts"]],
        )
        self.assertNotIn("function defaultZombieConfig(", json.dumps(current))
        self.assertEqual(
            sum(row["body_bytes"] for row in current["disabled_inline"]), 95878
        )

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
