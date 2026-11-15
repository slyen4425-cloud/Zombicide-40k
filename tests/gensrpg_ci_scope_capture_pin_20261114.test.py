#!/usr/bin/env python3
"""Regression tests for strict CI scoping: never skip shared/module checks."""
import importlib.util
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[1] / "tools/gensrpg_ci_scope_capture_pin_20261114.py"
spec = importlib.util.spec_from_file_location("ci_scope", SOURCE)
ci_scope = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ci_scope)

PIN = "tools/capture_v2_pages_preview_pin.json"
TEST = "tests/gens_capture_hero_road_pages_pin_20261114.test.mjs"


class ScopeTests(unittest.TestCase):
    def test_pin_and_regression_only_use_focused_gate(self):
        for paths in ({PIN}, {TEST}, {PIN, TEST}):
            with self.subTest(paths=paths):
                self.assertEqual(ci_scope.classify(paths, "pull_request"), "capture_pin_only")

    def test_every_unapproved_change_forces_full_checks(self):
        for other in (
            "index.html",
            "service-worker.js",
            "assets/gensrpg/core/storage-v1.js",
            "assets/gensrpg/dungeon/core200-rebuild-v1.js",
            "assets/gensrpg/capture/engine.js",
            "assets/gensrpg/survival/rules.js",
            "assets/gensrpg/pvp/session.js",
            ".github/workflows/gensrpg-architecture-sentinels.yml",
            ".github/workflows/main.yml",
            "tools/other_release_pin.json",
            "tests/gens_preview_composition_v11411.test.cjs",
            "docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json",
        ):
            with self.subTest(path=other):
                self.assertEqual(ci_scope.classify({PIN, other}, "pull_request"), "full")

    def test_non_pull_request_or_empty_diff_always_full(self):
        for event in ("push", "workflow_dispatch", "schedule", "", "pull_request_target"):
            self.assertEqual(ci_scope.classify({PIN}, event), "full")
        self.assertEqual(ci_scope.classify(set(), "pull_request"), "full")

    def test_sha_validation_is_fail_closed(self):
        for bad in ("", "1234", "z" * 40, "b" * 39):
            with self.subTest(sha=bad):
                with self.assertRaises(ValueError):
                    ci_scope.git_changed_paths(bad, "a" * 40)


if __name__ == "__main__":
    unittest.main()
