from pathlib import Path
import subprocess

OLD_SIZE="8169442"
OLD_BLOB="a37acaabcb3202a8527c2d545f9e2ff4466ea1db"
NEW_SIZE="8169447"
NEW_BLOB="106d2ec6e82f3b777e1d724cd3f74f30a22fdf39"

HISTORICAL={
    Path("tests/gens_phase5_module_launch_final_shell_authority_preaudit_v1.test.cjs"),
    Path("tests/gens_phase5_startconfiguredgame_core200_global_retirement_v1.test.cjs"),
}
METADATA=[
    Path("docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json"),
    Path("docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv"),
    Path("docs/GENSRPG_PHASE2_INLINE_OWNERS.json"),
    Path("docs/GENSRPG_PHASE2_STORAGE_OWNERS.json"),
]

changed=[]

for p in sorted(Path("tests").glob("*.test.cjs")):
    text=p.read_text(encoding="utf-8")
    if OLD_SIZE not in text and OLD_BLOB not in text:
        continue
    if p in HISTORICAL:
        old_pair=f"[{OLD_SIZE},'{OLD_BLOB}']"
        new_pair=f"[{NEW_SIZE},'{NEW_BLOB}']"
        if old_pair not in text:
            raise SystemExit(f"historical pair missing in {p}")
        if new_pair not in text:
            text=text.replace(old_pair,old_pair+",\n  "+new_pair,1)
            p.write_text(text,encoding="utf-8")
            changed.append(str(p))
        continue
    text=text.replace(OLD_SIZE,NEW_SIZE).replace(OLD_BLOB,NEW_BLOB)
    p.write_text(text,encoding="utf-8")
    changed.append(str(p))

for p in METADATA:
    text=p.read_text(encoding="utf-8")
    if OLD_BLOB not in text:
        raise SystemExit(f"metadata old blob missing in {p}")
    text=text.replace(OLD_BLOB,NEW_BLOB)
    p.write_text(text,encoding="utf-8")
    changed.append(str(p))

if not changed:
    raise SystemExit("no stale current-runtime fingerprints found")

actual=sorted(subprocess.check_output(["git","diff","--name-only"],text=True).splitlines())
expected=sorted(set(changed))
if actual!=expected:
    raise SystemExit("bounded realignment diff mismatch\nactual="+repr(actual)+"\nexpected="+repr(expected))

for p in Path("tests").glob("*.test.cjs"):
    if p in HISTORICAL:
        continue
    text=p.read_text(encoding="utf-8")
    if OLD_BLOB in text or OLD_SIZE in text:
        raise SystemExit(f"stale current-runtime fingerprint remains in {p}")

for p in HISTORICAL:
    text=p.read_text(encoding="utf-8")
    if f"[{NEW_SIZE},'{NEW_BLOB}']" not in text:
        raise SystemExit(f"new historical runtime pair missing in {p}")

print(f"Lot32 fingerprint realignment prepared: {len(expected)} files")
