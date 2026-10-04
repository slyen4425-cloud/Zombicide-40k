#!/usr/bin/env python3
from pathlib import Path
import hashlib
import re

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"

BASE_SIZE=8167048
BASE_BLOB="3438e75b607d0b9bb68eb1d3edc2d97b3bd662ed"
TARGET_SIZE=8167007
TARGET_BLOB="9eff1bfddc9e4fab82f7a181eb9996ecce9c6ae4"

def git_blob(data: bytes) -> str:
    h=hashlib.sha1()
    h.update(f"blob {len(data)}\0".encode())
    h.update(data)
    return h.hexdigest()

base=INDEX.read_bytes()
assert len(base)==BASE_SIZE,(len(base),BASE_SIZE)
assert git_blob(base)==BASE_BLOB,(git_blob(base),BASE_BLOB)
text=base.decode("utf-8")

m=re.search(r'(<script\b[^>]*\bid=["\']captureFix139["\'][^>]*>)([\s\S]*?)(</script>)',text,re.I)
assert m,"captureFix139 missing"
block=m.group(2)
target='    try{captureEnsureStarterKitsForParticipants()}catch(e){}\n    try{saveActiveEnemies([])}catch(e){}\n\n    /* Tours : ne démarrent que si explicitement cochés */'
replacement='    try{captureEnsureStarterKitsForParticipants()}catch(e){}\n\n    /* Tours : ne démarrent que si explicitement cochés */'
assert block.count(target)==1,block.count(target)
new_block=block.replace(target,replacement,1)
assert "saveActiveEnemies" not in new_block
assert "loadActiveEnemies" not in new_block
assert "ACTIVE_ENEMIES_KEY" not in new_block
assert "captureEnsureStarterKitsForParticipants()" in new_block
assert "captureWorldState()" in new_block
assert "applyPregameGoldToParticipants(participants)" in new_block
assert "markSessionActive(true)" in new_block
assert "startTurnManagerForGame()" in new_block

text=text[:m.start(2)]+new_block+text[m.end(2):]
out=text.encode("utf-8")
assert len(out)==TARGET_SIZE,(len(out),TARGET_SIZE)
assert git_blob(out)==TARGET_BLOB,(git_blob(out),TARGET_BLOB)
INDEX.write_bytes(out)

tests=[
    ROOT/"tests/gens_phase9_capture139_session_dependency_preaudit_v1.test.cjs",
    ROOT/"tests/gens_phase9_capture139_base_profile_retirement_v1.test.cjs",
    ROOT/"tests/gens_phase9_capture139_active_enemies_retirement_v1.test.cjs",
]
for p in tests:
    s=p.read_text()
    assert BASE_BLOB in s,(p,"missing baseline blob")
    assert str(BASE_SIZE) in s,(p,"missing baseline size")
    s=s.replace(BASE_BLOB,TARGET_BLOB)
    s=s.replace(str(BASE_SIZE),str(TARGET_SIZE))
    p.write_text(s)

session=tests[0]
s=session.read_text()
old="assert.match(c139,/saveActiveEnemies\\(\\[\\]\\)/,'Capture139 must still expose the historical active-enemy reset dependency during preaudit');"
new="assert.doesNotMatch(c139,/saveActiveEnemies|loadActiveEnemies|ACTIVE_ENEMIES_KEY/,'Capture139 active-enemy dependency must remain retired by its dedicated Phase 9 seam');"
assert old in s
s=s.replace(old,new)
s=s.replace("saveActiveEnemiesResetCall:true","saveActiveEnemiesResetCall:false")
s=s.replace(
  "decision:'Base/Dungeon profile preparation dependency retired; saveActiveEnemies reset remains the next session dependency to preaudit'",
  "decision:'Base/Dungeon profile preparation and active-enemy legacy launch dependencies retired by dedicated Phase 9 seams'"
)
session.write_text(s)

base_test=tests[1]
s=base_test.read_text()
old="""assert.match(
  c139,
  /saveActiveEnemies\\(\\[\\]\\)/,
  'active-enemy reset is deliberately outside this seam and must remain unchanged'
);"""
new="""assert.doesNotMatch(
  c139,
  /saveActiveEnemies|loadActiveEnemies|ACTIVE_ENEMIES_KEY/,
  'the subsequent dedicated active-enemy seam must remain retired without weakening Base/Dungeon profile retirement'
);"""
assert old in s
s=s.replace(old,new)
s=s.replace("saveActiveEnemiesResetPreserved:true","saveActiveEnemiesResetPreserved:false")
base_test.write_text(s)

# Re-check the new dedicated target is now GREEN by construction.
dedicated=tests[2].read_text()
assert TARGET_BLOB in dedicated
assert str(TARGET_SIZE) in dedicated

print("GREEN candidate",TARGET_SIZE,TARGET_BLOB)
print("updated tests")
for p in tests:
    print("-",p.relative_to(ROOT))
