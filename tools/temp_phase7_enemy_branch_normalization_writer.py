from pathlib import Path
import hashlib
import subprocess

INDEX=Path("index.html")
ENTRY=Path("assets/gensrpg/dungeon/entry-v1.js")
CHAR=Path("tests/gens_phase7_dungeon_generated_enemy_branch_normalization_characterization_v1.test.cjs")
GUARD=Path("tests/gens_phase7_dungeon_generated_enemy_branch_normalization_v1.test.cjs")

OLD_SIZE=8169442
OLD_BLOB="a37acaabcb3202a8527c2d545f9e2ff4466ea1db"
NEW_SIZE=8169446
NEW_BLOB="8a70856f20102270dc7f3553dcef74fe1dc45ad8"

def git_blob(data: bytes) -> str:
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

raw=INDEX.read_bytes()
blob=git_blob(raw)
entry=ENTRY.read_text(encoding="utf-8")
char=CHAR.read_text(encoding="utf-8")
guard=GUARD.read_text(encoding="utf-8")

if len(raw)==NEW_SIZE and blob==NEW_BLOB and "function shouldInitializeGeneratedEnemyBranch" in entry:
    print("Lot 32 runtime patch already present; validating lot tests.")
    subprocess.run(["node",str(CHAR)],check=True)
    subprocess.run(["node",str(GUARD)],check=True)
    raise SystemExit(0)

if len(raw)!=OLD_SIZE or blob!=OLD_BLOB:
    raise SystemExit(f"Rule 26 fingerprint mismatch: size={len(raw)} blob={blob}")

index=raw.decode("utf-8")

entry_anchor='''  function pickWeightedGeneratedRoomKind(roomWeights,roll){'''
entry_insert='''  function shouldInitializeGeneratedEnemyBranch(enemy,room){
    return Number(enemy.dungeonRoom||0)===Number(room)&&enemy.dc200Branch===undefined;
  }

  function pickWeightedGeneratedRoomKind(roomWeights,roll){'''
if entry.count(entry_anchor)!=1:
    raise SystemExit(f"entry insertion seam count={entry.count(entry_anchor)}")
entry=entry.replace(entry_anchor,entry_insert,1)

export_old='''      buildGeneratedNonCombatRoomResult,
      pickWeightedGeneratedRoomKind,'''
export_new='''      buildGeneratedNonCombatRoomResult,
      shouldInitializeGeneratedEnemyBranch,
      pickWeightedGeneratedRoomKind,'''
if entry.count(export_old)!=1:
    raise SystemExit(f"entry export seam count={entry.count(export_old)}")
entry=entry.replace(export_old,export_new,1)

old_pred="if(Number(e.dungeonRoom||0)===Number(room)&&e.dc200Branch===undefined)e.dc200Branch=false"
new_pred="if(GensDungeonV1.exploration.shouldInitializeGeneratedEnemyBranch(e,room))e.dc200Branch=false"
if index.count(old_pred)!=1:
    raise SystemExit(f"createRoom predicate replacement count={index.count(old_pred)}")
index=index.replace(old_pred,new_pred,1)

for label,text in (("characterization",char),("guard",guard)):
    if text.count(str(OLD_SIZE))!=1 or text.count(OLD_BLOB)!=1:
        raise SystemExit(f"{label} fingerprint seam mismatch")
char=char.replace(str(OLD_SIZE),str(NEW_SIZE),1).replace(OLD_BLOB,NEW_BLOB,1)
guard=guard.replace(str(OLD_SIZE),str(NEW_SIZE),1).replace(OLD_BLOB,NEW_BLOB,1)

char_old="""assert.match(createSource,
  /Number\\(e\\.dungeonRoom\\|\\|0\\)===Number\\(room\\)&&e\\.dc200Branch===undefined/,
  'current normalization predicate must remain directly characterizable');"""
char_new="""assert.equal(
  (createSource.match(/GensDungeonV1\\.exploration\\.shouldInitializeGeneratedEnemyBranch\\(e,room\\)/g)||[]).length,
  1,
  'createRoom must delegate the normalization decision exactly once after the isolated raccord'
);
assert.doesNotMatch(createSource,
  /Number\\(e\\.dungeonRoom\\|\\|0\\)===Number\\(room\\)&&e\\.dc200Branch===undefined/,
  'createRoom must retire the duplicated inline normalization predicate');"""
if char.count(char_old)!=1:
    raise SystemExit(f"characterization source seam count={char.count(char_old)}")
char=char.replace(char_old,char_new,1)

char_old2="""assert.doesNotMatch(entry,/shouldInitializeGeneratedEnemyBranch/,
  'audit characterization must precede any extracted helper');"""
char_new2="""assert.equal(
  typeof sandbox.GensDungeonV1?.exploration?.shouldInitializeGeneratedEnemyBranch,
  'function',
  'post-raccord characterization must load the pure Dungeon predicate'
);"""
if char.count(char_old2)!=1:
    raise SystemExit(f"characterization helper seam count={char.count(char_old2)}")
char=char.replace(char_old2,char_new2,1)
char=char.replace(
    "currentOwner:'dungeonCore200Rebuild.createRoom'",
    "decisionOwner:'GensDungeonV1.exploration.shouldInitializeGeneratedEnemyBranch'",
    1
)
char=char.replace(
    "predicate:'Number(enemy.dungeonRoom||0)===Number(room) && enemy.dc200Branch===undefined'",
    "predicate:'delegated pure decision; mutation remains Core 2.00'",
    1
)

INDEX.write_text(index,encoding="utf-8")
ENTRY.write_text(entry,encoding="utf-8")
CHAR.write_text(char,encoding="utf-8")
GUARD.write_text(guard,encoding="utf-8")

out=INDEX.read_bytes()
out_blob=git_blob(out)
if len(out)!=NEW_SIZE or out_blob!=NEW_BLOB:
    raise SystemExit(f"output fingerprint mismatch: size={len(out)} blob={out_blob}")

print(f"Rule 26 output verified: size={len(out)} blob={out_blob}")

for test in [CHAR,GUARD]:
    subprocess.run(["node",str(test)],check=True)

print("Phase 7 lot 32 bounded runtime patch GREEN locally; historical fingerprints deferred to full CI")
