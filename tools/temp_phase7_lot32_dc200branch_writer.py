from pathlib import Path
import hashlib
import subprocess

INDEX=Path("index.html")
ENTRY=Path("assets/gensrpg/dungeon/entry-v1.js")
CHAR=Path("tests/gens_phase7_dungeon_generated_room_enemy_branch_normalization_characterization_v1.test.cjs")
GUARD=Path("tests/gens_phase7_dungeon_generated_room_enemy_branch_normalization_v1.test.cjs")

OLD_SIZE=8169442
OLD_BLOB="a37acaabcb3202a8527c2d545f9e2ff4466ea1db"
EXPECTED_NEW_SIZE=8169447

def git_blob(data: bytes) -> str:
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

raw=INDEX.read_bytes()
blob=git_blob(raw)
entry=ENTRY.read_text(encoding="utf-8")
char=CHAR.read_text(encoding="utf-8")
guard=GUARD.read_text(encoding="utf-8")

if len(raw)!=OLD_SIZE or blob!=OLD_BLOB:
    raise SystemExit(f"Rule 26 fingerprint mismatch: size={len(raw)} blob={blob}")

if "function shouldDefaultGeneratedRoomEnemyBranch(enemy,room)" not in entry:
    raise SystemExit("Dungeon pure predicate missing before Core raccord")

index=raw.decode("utf-8")
old_rule="Number(e.dungeonRoom||0)===Number(room)&&e.dc200Branch===undefined"
new_rule="GensDungeonV1.exploration.shouldDefaultGeneratedRoomEnemyBranch(e,room)"
if index.count(old_rule)!=1:
    raise SystemExit(f"dc200Branch bounded seam count={index.count(old_rule)}")
index=index.replace(old_rule,new_rule,1)

out=index.encode("utf-8")
out_blob=git_blob(out)
if len(out)!=EXPECTED_NEW_SIZE:
    raise SystemExit(f"unexpected output size: {len(out)} expected={EXPECTED_NEW_SIZE}")

for label,text in (("characterization",char),("guard",guard)):
    if text.count(str(OLD_SIZE))!=1 or text.count(OLD_BLOB)!=1:
        raise SystemExit(f"{label} old fingerprint seam mismatch")

char=char.replace(str(OLD_SIZE),str(EXPECTED_NEW_SIZE),1).replace(OLD_BLOB,out_blob,1)
guard=guard.replace(str(OLD_SIZE),str(EXPECTED_NEW_SIZE),1).replace(OLD_BLOB,out_blob,1)

char_old="""assert.match(createSource,
  /try\\{const all=loadActiveEnemies\\?\\.\\(\\)\\|\\|\\[\\];all\\.forEach\\(e=>\\{if\\(Number\\(e\\.dungeonRoom\\|\\|0\\)===Number\\(room\\)&&e\\.dc200Branch===undefined\\)e\\.dc200Branch=false\\}\\);saveActiveEnemies\\?\\.\\(all\\)\\}catch\\(e\\)\\{\\}/,
  'historical dc200Branch normalization must remain directly characterizable, including forEach and swallowed storage errors');"""
char_new="""assert.match(createSource,
  /try\\{const all=loadActiveEnemies\\?\\.\\(\\)\\|\\|\\[\\];all\\.forEach\\(e=>\\{if\\(GensDungeonV1\\.exploration\\.shouldDefaultGeneratedRoomEnemyBranch\\(e,room\\)\\)e\\.dc200Branch=false\\}\\);saveActiveEnemies\\?\\.\\(all\\)\\}catch\\(e\\)\\{\\}/,
  'dc200Branch normalization must delegate only the boolean rule while preserving forEach and swallowed storage errors');"""
if char.count(char_old)!=1:
    raise SystemExit(f"characterization inline-rule seam count={char.count(char_old)}")
char=char.replace(char_old,char_new,1)

char_old2="""assert.doesNotMatch(entry,/loadActiveEnemies|saveActiveEnemies|dc200Branch/,
  'Dungeon entry must not silently take storage/mutation authority during the audit');"""
char_new2="""assert.match(entry,/function shouldDefaultGeneratedRoomEnemyBranch\\(enemy,room\\)/,
  'Dungeon entry must own only the pure dc200Branch default predicate after raccord');
assert.doesNotMatch(entry,/loadActiveEnemies|saveActiveEnemies|\\.dc200Branch=false/,
  'Dungeon entry must not take storage or mutation authority');"""
if char.count(char_old2)!=1:
    raise SystemExit(f"characterization entry-authority seam count={char.count(char_old2)}")
char=char.replace(char_old2,char_new2,1)

INDEX.write_text(index,encoding="utf-8")
CHAR.write_text(char,encoding="utf-8")
GUARD.write_text(guard,encoding="utf-8")

print(f"Rule 26 output verified: size={len(out)} blob={out_blob}")

for test in [CHAR,GUARD]:
    subprocess.run(["node",str(test)],check=True)

actual=sorted(subprocess.check_output(["git","diff","--name-only"],text=True).splitlines())
expected=sorted([str(INDEX),str(CHAR),str(GUARD)])
if actual!=expected:
    raise SystemExit("bounded writer diff mismatch\nactual="+repr(actual)+"\nexpected="+repr(expected))

print("Phase 7 lot 32 bounded dc200Branch raccord GREEN locally")
