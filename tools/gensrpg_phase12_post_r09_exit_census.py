#!/usr/bin/env python3
"""Metadata-only Phase 12 EXIT census, gated to the exact R09 GREEN index.

The user must provide the R09 index.html (or a ZIP containing one identifiable
index). No source code, embedded image, JS body or secret is ever printed.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
import zipfile

from gensrpg_phase12_r06_source_inventory import git_blob, inventory, read_source

EXPECTED_SIZE = 2_093_066
EXPECTED_BLOB = "4dbe3314d5048f2def404ed674498c0670c04fc1"
CERTIFIED_COMMIT = "8580587f2aab5bc3918950bc152b4a56e4d79a8d"


def summarize(data: bytes, *, expected_size: int = EXPECTED_SIZE,
              expected_blob: str = EXPECTED_BLOB) -> dict:
    """Count real script tags without emitting their bodies; fail closed by default."""
    report = inventory(data, expected_size, expected_blob)
    scripts = report["scripts"]
    active = [s for s in scripts if s["status"] == "active" and not s["src"]]
    disabled = [s for s in scripts if s["status"] == "disabled" and not s["src"]]
    anonymous = [s for s in active if not s["id"]]
    named = [s for s in active if s["id"]]
    hint_totals: dict[str, dict[str, int]] = {}
    for entry in active:
        hint = entry["owner_hint"]
        row = hint_totals.setdefault(hint, {"count": 0, "body_bytes": 0})
        row["count"] += 1
        row["body_bytes"] += entry["body_bytes"]
    slim = lambda s: {
        "order": s["order"], "id": s["id"], "type": s["type"],
        "status": s["status"], "has_src": bool(s["src"]),
        "body_bytes": s["body_bytes"], "body_blob": s["body_blob"],
        "owner_hint_unverified": s["owner_hint"],
    }
    return {
        "source": {
            "checkpoint_commit": CERTIFIED_COMMIT if (
                expected_size == EXPECTED_SIZE and expected_blob == EXPECTED_BLOB
            ) else "synthetic-test-only",
            "bytes": report["source"]["bytes"],
            "git_blob": report["source"]["blob"],
        },
        "counts": {
            **report["counts"],
            "named_inline_active": len(named),
            "anonymous_inline_active": len(anonymous),
            "anonymous_active_bytes": sum(s["body_bytes"] for s in anonymous),
            "named_active_bytes": sum(s["body_bytes"] for s in named),
            "disabled_body_bytes": sum(s["body_bytes"] for s in disabled),
        },
        "unverified_id_hints": hint_totals,
        "largest_active_inline": [slim(s) for s in sorted(
            active, key=lambda s: s["body_bytes"], reverse=True
        )[:25]],
        "disabled_inline": [slim(s) for s in disabled],
        "tiny_inline_under_512_bytes_not_yet_certified_bootstraps": [
            slim(s) for s in active if s["body_bytes"] <= 512
        ],
        "all_scripts_metadata_only": [slim(s) for s in scripts],
        "warnings": [
            "Bodies and embedded images are never included.",
            "Owner hints by ID are NOT proof of a module's runtime ownership.",
            "Tiny active scripts are NOT automatically approved as bootstraps.",
            "Disabled scripts must never be reactivated by an archive/cleanup.",
            "This census permits no production-code migration or Phase 12 EXIT.",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="R09 index.html exact ou ZIP utilisateur")
    parser.add_argument("--output", type=Path, help="JSON de métadonnées en lecture seule")
    args = parser.parse_args()
    try:
        if not args.source.is_file():
            raise ValueError("Source absente")
        if zipfile.is_zipfile(args.source):
            with zipfile.ZipFile(args.source) as archive:
                candidates = [
                    info for info in archive.infolist()
                    if not info.is_dir() and
                    __import__("re").fullmatch(
                        r"index\.html(?:\(\d+\))?(?:\.txt)?",
                        Path(info.filename).name, flags=__import__("re").I
                    )
                ]
                if len(candidates) != 1 or candidates[0].file_size != EXPECTED_SIZE:
                    raise ValueError("ZIP : un seul index identifiable de taille R09 exacte requis")
        elif args.source.stat().st_size != EXPECTED_SIZE:
            raise ValueError("Fichier non conforme à la taille R09 GREEN")
        # read_source validates a unique identifiable index inside ZIP.
        result = summarize(read_source(args.source))
        rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
        if args.output:
            if args.output.resolve() == args.source.resolve():
                raise ValueError("Interdit d'écraser le fichier source")
            args.output.write_text(rendered, encoding="utf-8")
        else:
            sys.stdout.write(rendered)
    except (OSError, ValueError, UnicodeError, zipfile.BadZipFile) as error:
        print("R09 EXIT BLOCKED: " + str(error), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
