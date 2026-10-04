from pathlib import Path
import hashlib

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
OLD_BYTES=8167048
NEW_BYTES=8167007
OLD_BLOB="3438e75b607d0b9bb68eb1d3edc2d97b3bd662ed"
NEW_BLOB="9eff1bfddc9e4fab82f7a181eb9996ecce9c6ae4"

def git_blob(data: bytes) -> str:
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

data=INDEX.read_bytes()
assert len(data)==OLD_BYTES, (len(data), OLD_BYTES)
assert git_blob(data)==OLD_BLOB, git_blob(data)

text=data.decode("utf-8")
tag=text.index('id="captureFix139"')
start=text.rfind("<script",0,tag)
end=text.index("</script>",tag)
block=text[start:end]
needle='    try{saveActiveEnemies([])}catch(e){}\n'
assert block.count(needle)==1, block.count(needle)
block=block.replace(needle,"",1)
text=text[:start]+block+text[end:]
new_data=text.encode("utf-8")
assert len(new_data)==NEW_BYTES, (len(new_data), NEW_BYTES)
assert git_blob(new_data)==NEW_BLOB, git_blob(new_data)
INDEX.write_bytes(new_data)

tests=[
"tests/gens_phase9_capture139_session_dependency_preaudit_v1.test.cjs",
"tests/gens_phase9_capture139_base_profile_retirement_v1.test.cjs",
"tests/gens_phase9_capture139_active_enemies_retirement_v1.test.cjs",
"tests/gens_phase9_capture_public_entry_ownership_preaudit_v1.test.cjs",
"tests/gens_phase9_capture_identity_ownership_preaudit_v1.test.cjs",
"tests/gens_phase9_capture_participant_identity_preaudit_v1.test.cjs",
"tests/gens_phase9_capture_participant_identity_raccord_v1.test.cjs",
"tests/gens_phase9_capture_dungeon_identity_coupling_preaudit_v1.test.cjs",
"tests/gens_phase9_capture_pregame_ownership_raccord_v1.test.cjs",
]

for rel in tests:
    p=ROOT/rel
    s=p.read_text(encoding="utf-8")
    assert OLD_BLOB in s, rel+" old blob fingerprint missing"
    assert str(OLD_BYTES) in s, rel+" old byte fingerprint missing"
    s=s.replace(OLD_BLOB,NEW_BLOB).replace(str(OLD_BYTES),str(NEW_BYTES))
    p.write_text(s,encoding="utf-8")

p=ROOT/"tests/gens_phase9_capture139_session_dependency_preaudit_v1.test.cjs"
s=p.read_text(encoding="utf-8")
old="assert.match(c139,/saveActiveEnemies\\(\\[\\]\\)/,'Capture139 must still expose the historical active-enemy reset dependency during preaudit');"
new="assert.doesNotMatch(c139,/saveActiveEnemies|loadActiveEnemies|ACTIVE_ENEMIES_KEY/,'Capture139 must remain decoupled from the retired active-enemy dependency');"
assert old in s
s=s.replace(old,new)
s=s.replace("saveActiveEnemiesResetCall:true","saveActiveEnemiesResetCall:false")
s=s.replace(
"decision:'Base/Dungeon profile preparation dependency retired; saveActiveEnemies reset remains the next session dependency to preaudit'",
"decision:'Base/Dungeon profile preparation and Capture139 active-enemy reset dependencies are retired; legacy active-enemy authority remains for Survival/Dungeon'"
)
p.write_text(s,encoding="utf-8")

p=ROOT/"tests/gens_phase9_capture139_base_profile_retirement_v1.test.cjs"
s=p.read_text(encoding="utf-8")
old="""assert.match(
  c139,
  /saveActiveEnemies\\(\\[\\]\\)/,
  'active-enemy reset is deliberately outside this seam and must remain unchanged'
);"""
new="""assert.doesNotMatch(
  c139,
  /saveActiveEnemies|loadActiveEnemies|ACTIVE_ENEMIES_KEY/,
  'Capture139 active-enemy dependency must remain retired after the dedicated follow-up seam'
);"""
assert old in s
s=s.replace(old,new)
s=s.replace("saveActiveEnemiesResetPreserved:true","saveActiveEnemiesResetRetired:true")
p.write_text(s,encoding="utf-8")

p=ROOT/"tests/gens_phase9_capture_public_entry_ownership_preaudit_v1.test.cjs"
s=p.read_text(encoding="utf-8")
old="assert.ok(start139.includes('saveActiveEnemies([])'));"
new="assert.ok(!start139.includes('saveActiveEnemies([])'),'Capture139 active-enemy reset must remain retired after the dedicated Phase 9 seam');"
assert old in s
s=s.replace(old,new)
s=s.replace("'saveActiveEnemies updates Dungeon explore UI'","'legacy saveActiveEnemies still updates Dungeon explore UI outside Capture139'")
p.write_text(s,encoding="utf-8")

p=ROOT/"tests/gens_phase9_capture_dungeon_identity_coupling_preaudit_v1.test.cjs"
s=p.read_text(encoding="utf-8")
old="""assert.match(c139,/saveActiveEnemies\\(\\[\\]\\)/,
  'legacy Capture139 still resets active enemies through the historical shared/global seam');"""
new="""assert.doesNotMatch(c139,/saveActiveEnemies|loadActiveEnemies|ACTIVE_ENEMIES_KEY/,
  'Capture139 active-enemy dependency must remain retired after the dedicated Phase 9 seam');"""
assert old in s
s=s.replace(old,new)
s=s.replace("saveActiveEnemiesReset:true","saveActiveEnemiesReset:false")
p.write_text(s,encoding="utf-8")

p=ROOT/"tests/gens_phase9_capture139_active_enemies_retirement_v1.test.cjs"
s=p.read_text(encoding="utf-8")
s=s.replace(
"'RED must start from the exact verified Capture139 active-enemies preaudit runtime'",
"'GREEN must inspect the exact verified Capture139 active-enemies retirement runtime'"
)
s=s.replace(
"'RED must start from the exact verified Capture139 active-enemies preaudit blob'",
"'GREEN must inspect the exact verified Capture139 active-enemies retirement blob'"
)
p.write_text(s,encoding="utf-8")

print("prepared", NEW_BLOB, NEW_BYTES, len(tests), "sentinels")
