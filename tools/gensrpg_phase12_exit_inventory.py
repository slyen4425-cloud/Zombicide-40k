#!/usr/bin/env python3
"""Read-only Phase12 EXIT census: exact R06 GREEN index only, never changes runtime."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
import zipfile

from gensrpg_phase12_r06_source_inventory import git_blob, inventory, read_source

EXPECTED_SIZE = 2_643_155
EXPECTED_BLOB = "12fc91df4ee4c7989a172baa96f9790da6dc57f7"


def summarize(data: bytes, size: int = EXPECTED_SIZE, blob: str = EXPECTED_BLOB) -> dict:
    previous = inventory(data, size, blob)
    scripts = previous["scripts"]
    active = [s for s in scripts if s["status"] == "active" and s["src"] is None]
    disabled = [s for s in scripts if s["status"] == "disabled" and s["src"] is None]
    group = {}
    for item in active:
        key = item["owner_hint"]
        entry = group.setdefault(key, {"count": 0, "body_bytes": 0})
        entry["count"] += 1
        entry["body_bytes"] += item["body_bytes"]
    anonymous = [s for s in active if not s["id"]]
    large = [s for s in active if s["body_bytes"] >= 30000]
    return {
        "source": previous["source"],
        "counts": previous["counts"],
        "grouped_by_identifier_only_not_proven_ownership": group,
        "anonymous_inline_active": {"count": len(anonymous), "body_bytes": sum(s["body_bytes"] for s in anonymous)},
        "active_inline_over_30kb": [{"order": s["order"], "id": s["id"], "owner_hint": s["owner_hint"], "body_bytes": s["body_bytes"], "body_blob": s["body_blob"]} for s in large],
        "largest_active_inline": previous["largest_active_inline"],
        "disabled_metadata": [{"order": s["order"], "id": s["id"], "body_bytes": s["body_bytes"], "body_blob": s["body_blob"]} for s in disabled],
        "notes": [
            "No source code, images, secrets or script bodies are included in this report.",
            "Identifier grouping is a triage hint; anonymous and shared scripts have no proven domain owner.",
            "Never assign a module or choose an extraction solely from size or legacy id.",
            "Do not treat this read-only inventory as a new code-extraction permission."
        ],
    }


def main() -> int:
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("source", type=Path, help="Exact index.html of R06 GREEN or ZIP with only that index")
    cli.add_argument("--output", type=Path, help="Optional JSON metadata report path (not source HTML)")
    args = cli.parse_args()
    try:
        data = read_source(args.source)
        result = summarize(data)
        output = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
        if args.output:
            if args.output.resolve() == args.source.resolve():
                raise ValueError("Refus: sortie identique à la source")
            args.output.write_text(output, encoding="utf-8")
        else:
            print(output, end="")
    except (OSError, ValueError, UnicodeError, zipfile.BadZipFile) as exc:
        print("Phase12 EXIT source refusée : " + str(exc), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
