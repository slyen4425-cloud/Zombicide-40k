#!/usr/bin/env python3
"""Phase 10 S2: exact, byte-pinned Rule 26 index composition apply/verify.

The sole source is index.html already checked out at the verified Git blob,
which matches the ZIP provided by the user. No reconstruction from fragments.
"""
from pathlib import Path
import argparse
import hashlib

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
SOURCE_SIZE = 7933755
SOURCE_BLOB = "613b4a21d83e9adcdd091be82240a3a6f9cf5bf7"
TARGET_SIZE = 7934204
TARGET_BLOB = "bf996ec4e748a4927ac6dd57cceaeaf2afcd9441"
ANCHOR = b'<script src="assets/gensrpg/shell/module-launch-final-authority-v1.js"></script>'
INSERT = (
    b'<script src="assets/gensrpg/pvp/session-v1.js"></script>\n'
    b'<script src="assets/gensrpg/pvp/module-launch-v1.js"></script>\n'
    b'<script src="assets/gensrpg/pvp/shell-composition-v1.js"></script>\n'
    b'<script>\n'
    b'  try {\n'
    b'    if (window.GensPvpShellCompositionV1.connect() !== true) {\n'
    b'      console.warn("GenSrpG Phase 10 PvP Shell composition unavailable");\n'
    b'    }\n'
    b'  } catch (error) {\n'
    b'    console.error("GenSrpG Phase 10 PvP Shell composition", error);\n'
    b'  }\n'
    b'</script>\n'
)

def blob(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\\0" + data).hexdigest()

def verify_source(data):
    assert len(data) == SOURCE_SIZE and blob(data) == SOURCE_BLOB, (
        f"Source refused: size={len(data)}, blob={blob(data)}"
    )
    assert data.count(ANCHOR) == 1 and INSERT not in data, "Unexpected index composition"

def verify_target(data):
    assert len(data) == TARGET_SIZE and blob(data) == TARGET_BLOB, (
        f"Target refused: size={len(data)}, blob={blob(data)}"
    )
    assert data.count(INSERT) == 1 and data.count(ANCHOR) == 1
    recovered = data.replace(INSERT, b"", 1)
    verify_source(recovered)
    assert data == recovered.replace(ANCHOR, INSERT + ANCHOR, 1)
    print(f"Verified byte-exact S2 index: {len(data)} bytes, Git blob {blob(data)}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    if args.apply == args.verify:
        parser.error("Choose exactly one of --apply or --verify")
    data = INDEX.read_bytes()
    if args.apply:
        verify_source(data)
        modified = data.replace(ANCHOR, INSERT + ANCHOR, 1)
        verify_target(modified)
        INDEX.write_bytes(modified)
    else:
        verify_target(data)

if __name__ == "__main__":
    main()
