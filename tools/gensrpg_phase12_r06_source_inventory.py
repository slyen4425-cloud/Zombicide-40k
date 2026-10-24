#!/usr/bin/env python3
"""Read-only Phase12/R06 inline-script inventory; never edits the source.

The current validated index must be supplied as a standalone file or ZIP.
Fails closed unless byte length and Git blob SHA match the R06 START checkpoint.
Prints only script metadata and sizes (never embedded source / secrets).
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import zipfile

EXPECTED_SIZE = 2_782_155
EXPECTED_BLOB = "b33542b033c5afa8a1643d99c56c21dbd4be266c"
SCRIPT = re.compile(r"<script\b(?P<attrs>[^>]*)>(?P<body>.*?)</script\s*>", re.I | re.S)


def git_blob(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def read_source(path: Path) -> bytes:
    if not path.is_file():
        raise ValueError(f"Source absente : {path}")
    if not zipfile.is_zipfile(path):
        return path.read_bytes()
    with zipfile.ZipFile(path) as zf:
        # Read only; never extract files or honor member directory names.
        members = [
            name for name in zf.namelist()
            if re.fullmatch(r"index\.html(?:\(\d+\))?(?:\.txt)?", Path(name).name, re.I)
            and not name.endswith("/")
        ]
        if len(members) != 1:
            raise ValueError(f"Le ZIP doit contenir un seul index.html identifiable (trouvés : {len(members)})")
        return zf.read(members[0])


def attr(text: str, key: str) -> str:
    match = re.search(r"\b" + re.escape(key) + r"\s*=\s*([\"'])(.*?)\1", text, flags=re.I | re.S)
    return match.group(2).strip() if match else ""


def category(ident: str) -> str:
    # Classification only from the published script ID; never infer ownership
    # from a generic anonymous body without a source/contract audit.
    ident = ident.lower()
    if not ident:
        return "anonymous-unclassified"
    if ident.startswith(("capture", "cap_", "monster")):
        return "capture-candidate"
    if ident.startswith(("dungeon", "dc0", "gensdungeon", "drc")):
        return "dungeon-candidate"
    if ident.startswith(("gens", "core", "rpg")):
        return "shared-unverified"
    return "unclassified"


def inventory(data: bytes, expected_size=EXPECTED_SIZE, expected_blob=EXPECTED_BLOB) -> dict:
    blob = git_blob(data)
    if len(data) != expected_size or blob != expected_blob:
        raise ValueError(
            f"Source hors checkpoint R06 : bytes={len(data)}, blob={blob}; "
            f"attendus bytes={expected_size}, blob={expected_blob}. Ne pas réutiliser un ancien ZIP."
        )
    source = data.decode("utf-8")
    scripts = []
    for match in SCRIPT.finditer(source):
        attrs, body = match.group("attrs"), match.group("body")
        ident, src, script_type = attr(attrs, "id"), attr(attrs, "src"), attr(attrs, "type").lower()
        disabled = script_type == "application/x-gensrpg-disabled"
        executable = not disabled and script_type in ("", "text/javascript", "application/javascript", "module")
        script_bytes = body.encode("utf-8")
        scripts.append({
            "order": len(scripts) + 1,
            "id": ident or None,
            "src": src or None,
            "type": script_type or "text/javascript",
            "status": "disabled" if disabled else ("active" if executable else "non-js"),
            "owner_hint": category(ident),
            "body_bytes": len(script_bytes) if not src else 0,
            "body_blob": git_blob(script_bytes) if not src else None,
        })
    if not scripts:
        raise ValueError("Aucune balise script détectée, source HTML probablement invalide.")
    active = [s for s in scripts if s["status"] == "active" and not s["src"]]
    return {
        "source": {"bytes": len(data), "blob": blob},
        "counts": {
            "script_tags": len(scripts),
            "external": sum(bool(s["src"]) for s in scripts),
            "inline_active": len(active),
            "inline_disabled": sum(s["status"] == "disabled" and not s["src"] for s in scripts),
            "inline_non_js": sum(s["status"] == "non-js" and not s["src"] for s in scripts),
            "inline_active_bytes": sum(s["body_bytes"] for s in active),
        },
        "scripts": scripts,
        "largest_active_inline": sorted(active, key=lambda x: x["body_bytes"], reverse=True)[:20],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Exact index.html or ZIP of exact index.html")
    parser.add_argument("--output", type=Path, help="Optional local JSON report; never overwrite HTML")
    args = parser.parse_args()
    try:
        report = inventory(read_source(args.source))
    except (OSError, ValueError, UnicodeError, zipfile.BadZipFile) as exc:
        print(f"R06 BLOCKED: {exc}", file=sys.stderr)
        return 2
    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        if args.output.resolve() == args.source.resolve():
            print("R06 BLOCKED: sortie identique à la source", file=sys.stderr)
            return 2
        args.output.write_text(rendered + "\n", encoding="utf-8")
    else:
        print(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
