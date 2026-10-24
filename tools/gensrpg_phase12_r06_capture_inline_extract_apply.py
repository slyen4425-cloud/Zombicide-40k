#!/usr/bin/env python3
"""Phase12 R06: byte-exact relocation of 18 consecutive Capture inline scripts.

Only captures the vetted R06 source / reconstructed R06 output. No gameplay
edits and no inferred ownership changes. Can be applied on a clean checkout by
the one-shot guarded GitHub workflow; --verify is read-only and fails closed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE_BLOB = "b33542b033c5afa8a1643d99c56c21dbd4be266c"
OUTPUT_BLOB = "12fc91df4ee4c7989a172baa96f9790da6dc57f7"
ORIGINAL_BYTES = 2782155
OUTPUT_BYTES = 2643155
NAMES = [
    "captureGameplayModalMount", "capturePlaytestFix128",
    *[f"captureFix{i}" for i in range(129, 141)],
    "captureItems141", "captureBuffs142", "captureBuffFx143",
    "captureAbilityTruth144",
]
assert len(NAMES) == 18
FOLDER = "assets/gensrpg/capture/legacy-patches"
CACHE_OLD = "gensrpg-cache-16.78.114.11-phase4-stats-s11-core-snapshot-1-r05-core-cloud-sync"
CACHE_NEW = CACHE_OLD + "-r06-capture-inline-exit"


def blob(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def location(name: str) -> str:
    return FOLDER + "/" + re.sub(r"(?<!^)(?=[A-Z])", "-", name).lower() + "-v1.js"


def external_tag(name: str) -> str:
    return f'<script id="{name}" src="{location(name)}"></script>'


def to_external(src: bytes):
    if len(src) != ORIGINAL_BYTES or blob(src) != SOURCE_BLOB:
        raise ValueError("R06 source not the approved user ZIP / START checkpoint")
    s = src.decode("utf-8")
    files = {}
    starts = []
    for name in NAMES:
        pattern = re.compile(r'(<script id="' + re.escape(name) + r'">)([\s\S]*?)(</script>)')
        matches = list(pattern.finditer(s))
        if len(matches) != 1:
            raise ValueError(f"R06 expected exactly one inline {name}, found {len(matches)}")
        match = matches[0]
        body = match.group(2).encode("utf-8")
        if not body or b"</script" in body.lower():
            raise ValueError(f"Unexpected script body {name}")
        starts.append(match.start())
        files[location(name)] = body
        s = s[:match.start()] + external_tag(name) + s[match.end():]
    # Positions checked on the original input in order, independently of body
    # length changes, to prevent moving a script across ownership boundaries.
    if not starts == sorted(starts):
        raise ValueError("Capture script order changed")
    data = s.encode("utf-8")
    if len(data) != OUTPUT_BYTES or blob(data) != OUTPUT_BLOB:
        raise ValueError(f"Unapproved R06 transformed index {len(data)} {blob(data)}")
    if restore(data, files) != src:
        raise ValueError("R06 byte-exact rollback failed")
    return data, files


def restore(data: bytes, files: dict[str, bytes]) -> bytes:
    s = data.decode("utf-8")
    for name in NAMES:
        tag = external_tag(name)
        if s.count(tag) != 1:
            raise ValueError("R06 expected one ordered, synchronous tag for " + name)
        body = files[location(name)].decode("utf-8")
        s = s.replace(tag, f'<script id="{name}">' + body + "</script>", 1)
    return s.encode("utf-8")


def sync_cache(files: dict[str, bytes], apply: bool):
    file = ROOT / "service-worker.js"
    text = file.read_text("utf-8")
    values = [f'"./{p}"' for p in files]
    anchor = '"./assets/gensrpg/core/legacy-cloud-sync-backup-v1.js",'
    if apply:
        if text.count(CACHE_OLD + '"') != 1 or CACHE_NEW in text or text.count(anchor) != 1:
            raise ValueError("PWA source not at R05 lock")
        text = text.replace(CACHE_OLD + '"', CACHE_NEW + '"', 1)
        text = text.replace(anchor, anchor + ",".join(values) + ",", 1)
        file.write_text(text, encoding="utf-8")
    else:
        if text.count(CACHE_NEW + '"') != 1 or any(text.count(v) != 1 for v in values):
            raise ValueError("R06 PWA cache does not include each new Capture asset exactly once")


def sync_owners(files: dict[str, bytes], apply: bool):
    file = ROOT / "docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json"
    raw = json.loads(file.read_text("utf-8"))
    mapped = raw["files"]
    if apply:
        if any(p in mapped for p in files):
            raise ValueError("R06 owners already exist; apply is not idempotent")
        for name in NAMES:
            rel = location(name)
            mapped[rel] = {
                "owner": "Monster Capture / historical " + name,
                "domain": "capture",
                "role": "Existing single Capture " + name +
                        " script physically moved byte-identical without changing behavior, "
                        "parser order or global assignment ownership; not a second engine",
            }
        file.write_text(json.dumps(raw, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    else:
        if any(mapped.get(p, {}).get("domain") != "capture" for p in files):
            raise ValueError("R06 new scripts are missing Capture manifest authority")


def update_pinned_test_sources(apply: bool):
    # Historical exact-view tests remain pinned to their ORIGINAL fingerprints.
    # Only the physical index assertions and reconstruction entry need updating.
    replacements = {
        "tests/gens_phase2_inline_owner_manifest_v11411.test.cjs": [
            ('const CURRENT_BLOB=\'' + SOURCE_BLOB + '\'', 'const CURRENT_BLOB=\'' + OUTPUT_BLOB + '\''),
        ],
        "tests/gens_phase2_inline_global_last_owner_v11411.test.cjs": [
            ('const CURRENT_INDEX_BLOB=\'' + SOURCE_BLOB + '\'', 'const CURRENT_INDEX_BLOB=\'' + OUTPUT_BLOB + '\''),
        ],
        "tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs": [
            ("assert.equal(reachable.size,107,", "assert.equal(reachable.size,125,"),
            ("assert.equal(mapped.size,107,", "assert.equal(mapped.size,125,"),
        ],
        "tests/helpers/gens_phase12_generated_wall_material_source_view_v1.cjs": [
            ("function restorePreWallMaterialIndex(index){\n",
             "function restorePreWallMaterialIndex(index){\n"
             "  index=require('./gens_phase12_r06_capture_source_view_v1.cjs')(index);\n"),
        ],
        ".github/workflows/gensrpg-phase12-r06-source-intake.yml": [
            ("test \"$(git hash-object index.html)\" = '" + SOURCE_BLOB + "'",
             "test \"$(git hash-object index.html)\" = '" + OUTPUT_BLOB + "'"),
        ],
    }
    for rel, changes in replacements.items():
        f = ROOT / rel
        text = f.read_text("utf-8")
        for old, new in changes:
            if apply:
                if text.count(old) != 1:
                    raise ValueError(f"R06 pinned-source anchor missing {rel}: {old}")
                text = text.replace(old, new, 1)
            elif text.count(new) != 1:
                raise ValueError(f"R06 transformed pinned-source assertion absent {rel}")
        if apply:
            f.write_text(text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--apply", action="store_true")
    group.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    index = ROOT / "index.html"
    if args.apply:
        output, files = to_external(index.read_bytes())
        for rel, payload in files.items():
            file = ROOT / rel
            if file.exists():
                raise ValueError("Refusing to overwrite pre-existing module " + rel)
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_bytes(payload)
        index.write_bytes(output)
        sync_cache(files, True)
        sync_owners(files, True)
        update_pinned_test_sources(True)
    else:
        actual = index.read_bytes()
        if len(actual) != OUTPUT_BYTES or blob(actual) != OUTPUT_BLOB:
            raise ValueError("R06 output index blob does not match the planned transformation")
        files = {location(name): (ROOT / location(name)).read_bytes() for name in NAMES}
        if len(files) != 18 or any(not p for p in files.values()):
            raise ValueError("Missing Capture modules")
        restored = restore(actual, files)
        if len(restored) != ORIGINAL_BYTES or blob(restored) != SOURCE_BLOB:
            raise ValueError("R06 rollback is not byte-exact")
        sync_cache(files, False)
        sync_owners(files, False)
        update_pinned_test_sources(False)
    print(json.dumps({
        "mode": "apply" if args.apply else "verify",
        "capture_scripts": len(files),
        "moved_bytes": sum(map(len, files.values())),
        "source_blob": SOURCE_BLOB,
        "result_blob": OUTPUT_BLOB,
        "result_bytes": OUTPUT_BYTES,
        "rollback_byte_exact": True,
        "loaded_sequential_classic": True,
    }, sort_keys=True))


if __name__ == "__main__":
    main()
