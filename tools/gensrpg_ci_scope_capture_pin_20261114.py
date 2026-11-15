#!/usr/bin/env python3
"""Fail-closed CI routing for the existing single-authority Pages publisher.

Only the immutable Capture V2 source pin and its corresponding regression test
qualify for focused validation. Shared runtime, architecture, workflow, module,
or any unknown file changes always retain the full CI matrix.
"""
from __future__ import annotations

import hashlib
import os
import re
import subprocess
from pathlib import Path

FOCUSED_PATHS = frozenset({
    "tools/capture_v2_pages_preview_pin.json",
    "tests/gens_capture_hero_road_pages_pin_20261114.test.mjs",
})
SHA_RE = re.compile(r"^[0-9a-f]{40}$")


def classify(paths: set[str], event_name: str) -> str:
    if event_name != "pull_request" or not paths:
        return "full"
    return "capture_pin_only" if paths <= FOCUSED_PATHS else "full"


def git_changed_paths(base_sha: str, head_sha: str) -> set[str]:
    if not SHA_RE.fullmatch(base_sha) or not SHA_RE.fullmatch(head_sha):
        raise ValueError("Missing or invalid immutable PR base/head SHA; fail closed")
    result = subprocess.check_output([
        "git", "diff", "--name-only", "--no-renames", "-z", base_sha, head_sha,
    ])
    return {name.decode("utf-8") for name in result.split(b"\0") if name}


def verify_foreign_paths_unchanged(base_sha: str, head_sha: str) -> None:
    """Prove all non-pin tracked bytes + modes unchanged using Git object diffs."""
    args = [
        "git", "diff", "--quiet", "--no-renames", base_sha, head_sha, "--", ".",
        *[":(exclude)" + path for path in sorted(FOCUSED_PATHS)],
    ]
    result = subprocess.run(args, check=False)
    if result.returncode:
        raise RuntimeError(
            f"Non-Capture or unknown tracked content differs (git exit {result.returncode})"
        )


def main() -> None:
    event_name = os.environ.get("CI_EVENT_NAME", "")
    base_sha = os.environ.get("CI_BASE_SHA", "").lower()
    head_sha = os.environ.get("CI_HEAD_SHA", "").lower()
    paths: set[str] = set()
    if event_name == "pull_request":
        paths = git_changed_paths(base_sha, head_sha)
    mode = classify(paths, event_name)
    if mode == "capture_pin_only":
        verify_foreign_paths_unchanged(base_sha, head_sha)
    print("CI_SCOPE_MODE", mode)
    print("CI_SCOPE_CHANGED", sorted(paths))
    if mode == "capture_pin_only":
        for name in sorted(paths):
            path = Path(name)
            if path.is_file():
                print("CI_SCOPE_SHA256", name, hashlib.sha256(path.read_bytes()).hexdigest())
        print("CI_SCOPE_FOREIGN", "all other tracked paths byte-identical to PR base")
    target = os.environ.get("GITHUB_OUTPUT")
    if target:
        with open(target, "a", encoding="utf-8") as out:
            out.write(f"mode={mode}\n")


if __name__ == "__main__":
    main()
