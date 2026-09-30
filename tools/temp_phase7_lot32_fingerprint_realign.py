from pathlib import Path
import subprocess

OLD_SIZE="8169442"
OLD_BLOB="a37acaabcb3202a8527c2d545f9e2ff4466ea1db"
NEW_SIZE="8169446"
NEW_BLOB="8a70856f20102270dc7f3553dcef74fe1dc45ad8"

HISTORICAL={
  "tests/gens_phase5_module_launch_final_shell_authority_preaudit_v1.test.cjs",
  "tests/gens_phase5_startconfiguredgame_core200_global_retirement_v1.test.cjs",
}
METADATA=[
  "docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json",
  "docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv",
  "docs/GENSRPG_PHASE2_INLINE_OWNERS.json",
  "docs/GENSRPG_PHASE2_STORAGE_OWNERS.json",
]

def stale_test_paths():
    out=[]
    for p in sorted(Path("tests").rglob("*.test.cjs")):
        text=p.read_text(encoding="utf-8")
        if OLD_SIZE in text or OLD_BLOB in text:
            out.append(str(p))
    return out

stale=stale_test_paths()
old_pair=f"[{OLD_SIZE},'{OLD_BLOB}']"
new_pair=f"[{NEW_SIZE},'{NEW_BLOB}']"

# Idempotent second run after the bot commit: only historical references may remain.
if set(stale)==HISTORICAL:
    for name in HISTORICAL:
        text=Path(name).read_text(encoding="utf-8")
        if old_pair not in text or new_pair not in text:
            raise SystemExit(f"historical map incomplete after realignment in {name}")
    for name in METADATA:
        text=Path(name).read_text(encoding="utf-8")
        if NEW_BLOB not in text:
            raise SystemExit(f"metadata not realigned in {name}")
    print("Lot32 fingerprint realignment already present.")
    raise SystemExit(0)

if len(stale)!=84:
    raise SystemExit(f"unexpected stale test fingerprint file count={len(stale)}")
if not HISTORICAL.issubset(set(stale)):
    raise SystemExit("expected historical fingerprint maps missing")

STRICT=sorted(set(stale)-HISTORICAL)
if len(STRICT)!=82:
    raise SystemExit(f"unexpected strict current-runtime guard count={len(STRICT)}")

changed=[]

for name in STRICT:
    p=Path(name)
    text=p.read_text(encoding="utf-8")
    if OLD_SIZE not in text and OLD_BLOB not in text:
        raise SystemExit(f"missing stale current-runtime fingerprint in {name}")
    text=text.replace(OLD_SIZE,NEW_SIZE).replace(OLD_BLOB,NEW_BLOB)
    p.write_text(text,encoding="utf-8")
    changed.append(name)

for name in sorted(HISTORICAL):
    p=Path(name)
    text=p.read_text(encoding="utf-8")
    if old_pair not in text:
        raise SystemExit(f"historical old pair missing in {name}")
    if new_pair not in text:
        text=text.replace(old_pair,old_pair+",\n  "+new_pair,1)
    p.write_text(text,encoding="utf-8")
    changed.append(name)

for name in METADATA:
    p=Path(name)
    text=p.read_text(encoding="utf-8")
    if OLD_BLOB not in text:
        raise SystemExit(f"metadata previous sourceIndexBlob missing in {name}")
    text=text.replace(OLD_BLOB,NEW_BLOB)
    p.write_text(text,encoding="utf-8")
    changed.append(name)

actual=sorted(subprocess.check_output(["git","diff","--name-only"],text=True).splitlines())
expected=sorted(set(changed))
if actual!=expected:
    raise SystemExit("bounded realignment diff mismatch\nactual="+repr(actual)+"\nexpected="+repr(expected))

for name in STRICT:
    text=Path(name).read_text(encoding="utf-8")
    if OLD_SIZE in text or OLD_BLOB in text:
        raise SystemExit(f"stale current-runtime fingerprint remains in {name}")
    if NEW_SIZE not in text and NEW_BLOB not in text:
        raise SystemExit(f"new fingerprint missing in {name}")

for name in HISTORICAL:
    text=Path(name).read_text(encoding="utf-8")
    if old_pair not in text or new_pair not in text:
        raise SystemExit(f"historical fingerprint chain not preserved in {name}")

print(f"Lot32 fingerprint realignment prepared: strict={len(STRICT)} historical={len(HISTORICAL)} metadata={len(METADATA)}")
