#!/usr/bin/env python3
"""Repin only byte-fingerprint expectations for the CURRENT physical index.

No historical test fixture, rollback helper, game rule, or source index is
changed. The former approved source is still verified separately by the
byte-exact reversal helper.
"""
from pathlib import Path

OLD_BLOB="42583858f0df0f1b3bcd65ca6a282c8ba27b1c07"
NEW_BLOB="d19fb899e646ee97ec21d055b5271ac2cbba91a2"
OLD_SIZE="7958968"
NEW_SIZE="7959154"

changed=[]
for path in sorted(Path("tests").rglob("*.test.cjs")):
    text=path.read_text(encoding="utf-8")
    if OLD_BLOB not in text and OLD_SIZE not in text:
        continue
    updated=text.replace(OLD_BLOB,NEW_BLOB).replace(OLD_SIZE,NEW_SIZE)
    if updated!=text:
        path.write_text(updated,encoding="utf-8",newline="")
        changed.append(str(path))
assert 2 <= len(changed) <= 60, f"unexpected physical index pin count: {len(changed)}"
print("Repinned active physical index only:",len(changed))
print("\n".join(changed))
