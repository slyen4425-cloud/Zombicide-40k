from pathlib import Path
import hashlib
import subprocess

INDEX=Path("index.html")
ENTRY=Path("assets/gensrpg/dungeon/entry-v1.js")
CHAR=Path("tests/gens_phase7_dungeon_generated_boss_policy_post_authority_sweep_characterization_v1.test.cjs")
GUARD=Path("tests/gens_phase7_dungeon_generated_boss_policy_post_authority_sweep_v1.test.cjs")

OLD_SIZE=8169990
OLD_BLOB="1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082"
NEW_SIZE=8169856
NEW_BLOB="454b2e12cde591c2db19023d1b76055ebac8e1b1"

def git_blob(data: bytes) -> str:
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

raw=INDEX.read_bytes()
blob=git_blob(raw)
if len(raw)==NEW_SIZE and blob==NEW_BLOB:
    print("Boss policy runtime patch already present.")
    raise SystemExit(0)
if len(raw)!=OLD_SIZE or blob!=OLD_BLOB:
    raise SystemExit(f"Rule 26 fingerprint mismatch: size={len(raw)} blob={blob}")

index=raw.decode("utf-8")
entry=ENTRY.read_text(encoding="utf-8")
char=CHAR.read_text(encoding="utf-8")
guard=GUARD.read_text(encoding="utf-8")

old_choose="""function chooseKind(room){const c=cfg(),explicit=String(c.bossRooms||'').split(/[,; ]+/).map(Number).filter(n=>n>0);
 // Core 2.05 : si les Boss automatiques ne sont pas désactivés,
 // la dernière salle est toujours une épreuve de Boss.
 if(c.boss!=='none'&&room===Number(c.rooms))return'boss';
 if(c.boss==='everyN'&&room%Math.max(1,Number(c.bossEvery)||5)===0)return'boss';
 if(c.boss==='specific'&&explicit.includes(room))return'boss';
 if(c.boss==='random'&&room>2&&Math.random()*100<Math.max(0,Number(c.bossChance)||13))return'boss';
 return GensDungeonV1.exploration.pickWeightedGeneratedRoomKind(c.roomWeights,Math.random())}"""
new_choose="""function chooseKind(room){const c=cfg();
 // Core 2.05 : si les Boss automatiques ne sont pas désactivés,
 // la dernière salle est toujours une épreuve de Boss.
 const bossPlan=GensDungeonV1.exploration.planGeneratedBossPolicy(room,c.rooms,c.boss,c.bossEvery,c.bossRooms,c.bossChance);if(bossPlan.status==='boss')return'boss';if(bossPlan.status==='random'&&Math.random()*100<bossPlan.chance)return'boss';
 return GensDungeonV1.exploration.pickWeightedGeneratedRoomKind(c.roomWeights,Math.random())}"""
if index.count(old_choose)!=1:
    raise SystemExit(f"chooseKind replacement count={index.count(old_choose)}")
index=index.replace(old_choose,new_choose,1)

advance_tail="""    return {status:existing?.last?"existing":"create",targetRoom};
  }

  function pickWeightedGeneratedRoomKind(roomWeights,roll){"""
planner_insert="""    return {status:existing?.last?"existing":"create",targetRoom};
  }

  function planGeneratedBossPolicy(room,roomLimit,bossMode,bossEvery,bossRooms,bossChance){
    if(bossMode!=="none"&&room===Number(roomLimit))return {status:"boss",chance:null};
    if(bossMode==="everyN"&&room%Math.max(1,Number(bossEvery)||5)===0)return {status:"boss",chance:null};
    const explicit=String(bossRooms||"").split(/[,; ]+/).map(Number).filter(n=>n>0);
    if(bossMode==="specific"&&explicit.includes(room))return {status:"boss",chance:null};
    if(bossMode==="random"&&room>2)return {status:"random",chance:Math.max(0,Number(bossChance)||13)};
    return {status:"none",chance:null};
  }

  function pickWeightedGeneratedRoomKind(roomWeights,roll){"""
if entry.count(advance_tail)!=1:
    raise SystemExit(f"planner insertion count={entry.count(advance_tail)}")
entry=entry.replace(advance_tail,planner_insert,1)

export_old="""    exploration:Object.freeze({
      planGeneratedAdvance,
      pickWeightedGeneratedRoomKind,"""
export_new="""    exploration:Object.freeze({
      planGeneratedAdvance,
      planGeneratedBossPolicy,
      pickWeightedGeneratedRoomKind,"""
if entry.count(export_old)!=1:
    raise SystemExit(f"planner export count={entry.count(export_old)}")
entry=entry.replace(export_old,export_new,1)

for label,text in (("characterization",char),("guard",guard)):
    if text.count("8169990")!=1 or text.count(OLD_BLOB)!=1:
        raise SystemExit(f"{label} fingerprint seam mismatch")
char=char.replace("8169990","8169856",1).replace(OLD_BLOB,NEW_BLOB,1)
guard=guard.replace("8169990","8169856",1).replace(OLD_BLOB,NEW_BLOB,1)

old_source="""assert.match(chooseSource,/if\\(c\\.boss!==['"]none['"]&&room===Number\\(c\\.rooms\\)\\)return['"]boss['"]/,
  'final-room Boss rule must remain first');
assert.match(chooseSource,/if\\(c\\.boss===['"]everyN['"]&&room%Math\\.max\\(1,Number\\(c\\.bossEvery\\)\\|\\|5\\)===0\\)return['"]boss['"]/,
  'everyN Boss rule must remain intact');
assert.match(chooseSource,/if\\(c\\.boss===['"]specific['"]&&explicit\\.includes\\(room\\)\\)return['"]boss['"]/,
  'specific Boss rule must remain intact');
assert.match(chooseSource,/if\\(c\\.boss===['"]random['"]&&room>2&&Math\\.random\\(\\)\\*100<Math\\.max\\(0,Number\\(c\\.bossChance\\)\\|\\|13\\)\\)return['"]boss['"]/,
  'random Boss rule must remain lazy and inline');
assert.match(chooseSource,/GensDungeonV1\\.exploration\\.pickWeightedGeneratedRoomKind\\(c\\.roomWeights,Math\\.random\\(\\)\\)/,
  'non-Boss fallback must remain delegated with its own explicit RNG');"""
new_source="""assert.equal((chooseSource.match(/GensDungeonV1\\.exploration\\.planGeneratedBossPolicy\\(/g)||[]).length,1,
  'Core 2.00 must delegate generated Boss policy exactly once');
assert.match(chooseSource,
  /const bossPlan=GensDungeonV1\\.exploration\\.planGeneratedBossPolicy\\(room,c\\.rooms,c\\.boss,c\\.bossEvery,c\\.bossRooms,c\\.bossChance\\);if\\(bossPlan\\.status==='boss'\\)return'boss';if\\(bossPlan\\.status==='random'&&Math\\.random\\(\\)\\*100<bossPlan\\.chance\\)return'boss'/,
  'Core 2.00 must preserve lazy Boss RNG around the pure planner');
assert.doesNotMatch(chooseSource,/c\\.boss!==['"]none['"]&&room===Number\\(c\\.rooms\\)|c\\.boss===['"]everyN['"]|c\\.boss===['"]specific['"]|Math\\.max\\(0,Number\\(c\\.bossChance\\)\\|\\|13\\)/,
  'Boss policy decisions must no longer be duplicated inline');
assert.match(chooseSource,/GensDungeonV1\\.exploration\\.pickWeightedGeneratedRoomKind\\(c\\.roomWeights,Math\\.random\\(\\)\\)/,
  'non-Boss fallback must remain delegated with its own explicit RNG');"""
if char.count(old_source)!=1:
    raise SystemExit(f"characterization source seam count={char.count(old_source)}")
char=char.replace(old_source,new_source,1)

old_abs="""assert.equal(typeof sandbox.GensDungeonV1?.exploration?.planGeneratedBossPolicy,'undefined',
  'Boss planner must not exist before the dedicated RED');"""
new_abs="""assert.equal(typeof sandbox.GensDungeonV1?.exploration?.planGeneratedBossPolicy,'function',
  'Boss planner must own pure generated Boss policy after the isolated raccord');"""
if char.count(old_abs)!=1:
    raise SystemExit(f"characterization planner seam count={char.count(old_abs)}")
char=char.replace(old_abs,new_abs,1)

anchor="""assert.deepEqual(norm(plan(3,10,'random',5,'','bad')),{status:'random',chance:13});

const a=plan(3,10,'random',5,'',13);"""
replacement="""assert.deepEqual(norm(plan(3,10,'random',5,'','bad')),{status:'random',chance:13});
assert.deepEqual(norm(plan('10',10,'final',5,'',13)),{status:'none',chance:null});
assert.deepEqual(norm(plan('4',10,'specific',5,'2,4,7',13)),{status:'none',chance:null});

const a=plan(3,10,'random',5,'',13);"""
if guard.count(anchor)!=1:
    raise SystemExit(f"guard equality seam count={guard.count(anchor)}")
guard=guard.replace(anchor,replacement,1)

INDEX.write_text(index,encoding="utf-8")
ENTRY.write_text(entry,encoding="utf-8")
CHAR.write_text(char,encoding="utf-8")
GUARD.write_text(guard,encoding="utf-8")

out=INDEX.read_bytes()
out_blob=git_blob(out)
if len(out)!=NEW_SIZE or out_blob!=NEW_BLOB:
    raise SystemExit(f"Output fingerprint mismatch: size={len(out)} blob={out_blob}")
print(f"Rule 26 output verified: size={len(out)} blob={out_blob}")

subprocess.run(["node",str(CHAR)],check=True)
subprocess.run(["node",str(GUARD)],check=True)
print("Phase 7 lot 30 bounded patch GREEN locally")
