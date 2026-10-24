#!/usr/bin/env python3
"""Metadata-only Phase 12 EXIT inventory regressions. No production HTML loaded."""
from pathlib import Path
import os
import subprocess
import sys
import tempfile
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
        from gensrpg_phase12_r07_magic_audio_extract_apply import reverse, ROOT, REL
        from gensrpg_phase12_r08_shared_catalog_extract_apply import restore as r08_restore, ROOT as R08_ROOT, REL as R08_REL
        # Source historique figée certifiée à l'EXIT R06 -> R10. Le index
        # courant est modifiable après R10 : ce test doit continuer à valider
        # exactement les mêmes octets historiques, jamais un état récent
        # en prétendant qu'il est byte-identique aux extractions précédentes.
        root = Path(__file__).resolve().parents[1]
        certified_ref = "3f197edeccd10d7f103126a6eb8c3f5db92bf609"
        # GitHub Actions checks out PRs with shallow history. Fetch the exact
        # certified checkpoint only if its commit object is not present.
        has_ref = subprocess.run(
            ["git", "cat-file", "-e", f"{certified_ref}^{{commit}}"],
            cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        ).returncode == 0
        if not has_ref:
            subprocess.run(
                ["git", "fetch", "--no-tags", "--depth=1", "origin", certified_ref],
                cwd=root, check=True, stdout=subprocess.DEVNULL,
            )
        original = subprocess.check_output(["git", "show", f"{certified_ref}:index.html"], cwd=root)
        self.assertEqual(git_blob(original), "260f00aa179c939f35188ca854f9875971ce8a7b")
        with tempfile.TemporaryDirectory(prefix="gensrpg-historical-r06-") as tmp:
            historical = Path(tmp)
            (historical / "index.html").write_bytes(original)
            for name in ("tools", "assets", "docs"):
                os.symlink(root / name, historical / name, target_is_directory=True)
            r08_index = subprocess.check_output(
                ["node", str(root / "tools/gensrpg_phase12_r09_wave_extract_apply.cjs"), "--restore-r08"],
                cwd=historical,
            )
        report = summarize(reverse(r08_restore(r08_index, (R08_ROOT / R08_REL).read_bytes()), (ROOT / REL).read_bytes()))
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
