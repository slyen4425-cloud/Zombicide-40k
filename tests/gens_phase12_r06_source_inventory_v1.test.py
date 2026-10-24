#!/usr/bin/env python3
"""Synthetic regression checks for the read-only R06 source intake."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

TOOL = Path(__file__).resolve().parents[1] / "tools/gensrpg_phase12_r06_source_inventory.py"
spec = importlib.util.spec_from_file_location("r06_source_inventory", TOOL)
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

DOC = b"""<!doctype html><html><script id="dungeonCore079MapPolish">var d=1;</script>
<script id='captureFix129' type='text/javascript'>var c=2;</script>
<script src="assets/gensrpg/dungeon/core01-session-ui-v1.js"></script>
<script id="retired" type="application/x-gensrpg-disabled">legacy();</script>
<script type="application/json" id="profile-config">{"mode":"dungeon"}</script>
<script>console.log("anonymous");</script></html>"""


class SourceInventoryTests(unittest.TestCase):
    def test_byte_exact_acceptance_and_status(self):
        report = inv.inventory(DOC, len(DOC), inv.git_blob(DOC))
        self.assertEqual(report["source"]["blob"], inv.git_blob(DOC))
        self.assertEqual(report["counts"]["script_tags"], 6)
        self.assertEqual(report["counts"]["external"], 1)
        self.assertEqual(report["counts"]["inline_active"], 3)
        self.assertEqual(report["counts"]["inline_disabled"], 1)
        self.assertEqual(report["counts"]["inline_non_js"], 1)
        scripts = report["scripts"]
        self.assertEqual(scripts[0]["owner_hint"], "dungeon-candidate")
        self.assertEqual(scripts[1]["owner_hint"], "capture-candidate")
        self.assertEqual(scripts[-1]["owner_hint"], "anonymous-unclassified")
        self.assertEqual(scripts[2]["body_blob"], None)
        self.assertFalse(any("var d=1;" in json.dumps(s) for s in scripts), "never dump executable body")
        self.assertTrue(report["largest_active_inline"])
        self.assertEqual(
            report["counts"]["inline_active_bytes"],
            sum(s["body_bytes"] for s in report["largest_active_inline"]),
        )

    def test_wrong_old_zip_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Source hors checkpoint"):
            inv.inventory(DOC)
        with self.assertRaisesRegex(ValueError, "Source hors checkpoint"):
            inv.inventory(DOC + b"!", len(DOC), inv.git_blob(DOC))

    def test_plain_and_zip_source_are_equivalent(self):
        with tempfile.TemporaryDirectory() as d:
            plain, zipped = Path(d) / "index.html", Path(d) / "source.zip"
            plain.write_bytes(DOC)
            with zipfile.ZipFile(zipped, "w") as zf:
                zf.writestr("archive/index.html(19).txt", DOC)
            self.assertEqual(inv.read_source(plain), DOC)
            self.assertEqual(inv.read_source(zipped), DOC)

    def test_zip_requires_single_unambiguous_index(self):
        with tempfile.TemporaryDirectory() as d:
            z = Path(d) / "two.zip"
            with zipfile.ZipFile(z, "w") as out:
                out.writestr("index.html", DOC)
                out.writestr("backup/index.html(7).txt", DOC)
            with self.assertRaisesRegex(ValueError, "un seul index"):
                inv.read_source(z)


if __name__ == "__main__":
    unittest.main(verbosity=2)
