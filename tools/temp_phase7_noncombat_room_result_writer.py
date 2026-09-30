from pathlib import Path
import hashlib
import subprocess

INDEX=Path("index.html")
ENTRY=Path("assets/gensrpg/dungeon/entry-v1.js")
CHAR=Path("tests/gens_phase7_dungeon_generated_room_materialization_characterization_v1.test.cjs")
GUARD=Path("tests/gens_phase7_dungeon_generated_noncombat_room_result_v1.test.cjs")

OLD_SIZE=8169856
OLD_BLOB="454b2e12cde591c2db19023d1b76055ebac8e1b1"
NEW_SIZE=8169442
NEW_BLOB="a37acaabcb3202a8527c2d545f9e2ff4466ea1db"

def git_blob(data: bytes) -> str:
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

raw=INDEX.read_bytes()
blob=git_blob(raw)
entry=ENTRY.read_text(encoding="utf-8")
char=CHAR.read_text(encoding="utf-8")
guard=GUARD.read_text(encoding="utf-8")

if len(raw)==NEW_SIZE and blob==NEW_BLOB and "function buildGeneratedNonCombatRoomResult" in entry:
    print("Lot 31 runtime patch already present; validating tests.")
    subprocess.run(["node",str(CHAR)],check=True)
    subprocess.run(["node",str(GUARD)],check=True)
    raise SystemExit(0)

if len(raw)!=OLD_SIZE or blob!=OLD_BLOB:
    raise SystemExit(f"Rule 26 fingerprint mismatch: size={len(raw)} blob={blob}")

index=raw.decode("utf-8")

entry_anchor='''  function pickWeightedGeneratedRoomKind(roomWeights,roll){'''
entry_insert='''  function buildGeneratedNonCombatRoomResult(kind,trapType){
    if(kind==="trap")return {title:"🪤 "+trapType.name,text:"Un piège est présent dans la salle.",enemyQty:0,trapId:trapType.id};
    if(kind==="chest")return {title:"🎁 Coffre",text:"Un coffre est présent dans la salle.",enemyQty:0};
    if(kind==="merchant")return {title:"🧙‍♂️ Marchand",text:"Un marchand attend le groupe.",enemyQty:0};
    if(kind==="rest")return {title:"⛩️ Sanctuaire",text:"Un lieu de repos.",enemyQty:0};
    return {title:"✨ Salle calme",text:"La salle semble calme.",enemyQty:0};
  }

  function pickWeightedGeneratedRoomKind(roomWeights,roll){'''
if entry.count(entry_anchor)!=1:
    raise SystemExit(f"entry insertion seam count={entry.count(entry_anchor)}")
entry=entry.replace(entry_anchor,entry_insert,1)

export_old='''      planGeneratedBossPolicy,
      pickWeightedGeneratedRoomKind,'''
export_new='''      planGeneratedBossPolicy,
      buildGeneratedNonCombatRoomResult,
      pickWeightedGeneratedRoomKind,'''
if entry.count(export_old)!=1:
    raise SystemExit(f"entry export seam count={entry.count(export_old)}")
entry=entry.replace(export_old,export_new,1)

old_create="""function createRoom(room,kind){let result={title:'Salle',text:'',enemyQty:0,enemyName:''};if(kind==='enemy'||kind==='ambush')result=dungeonEncounter(room);else if(kind==='boss')result=dungeonBossRoom(room);else if(kind==='trap'){const t=dungeonPickTrapType?.(cfg())||{name:'Piège',id:'trap'};result={title:'🪤 '+t.name,text:'Un piège est présent dans la salle.',enemyQty:0,trapId:t.id}}else if(kind==='chest')result={title:'🎁 Coffre',text:'Un coffre est présent dans la salle.',enemyQty:0};else if(kind==='merchant')result={title:'🧙‍♂️ Marchand',text:'Un marchand attend le groupe.',enemyQty:0};else if(kind==='rest')result={title:'⛩️ Sanctuaire',text:'Un lieu de repos.',enemyQty:0};else result={title:'✨ Salle calme',text:'La salle semble calme.',enemyQty:0};try{const all=loadActiveEnemies?.()||[];all.forEach(e=>{if(Number(e.dungeonRoom||0)===Number(room)&&e.dc200Branch===undefined)e.dc200Branch=false});saveActiveEnemies?.(all)}catch(e){}const mapObj=cfg().map===false?null:generateDungeonMap(kind,result.enemyQty||0);return {result,map:mapObj}}"""
new_create="""function createRoom(room,kind){let result={title:'Salle',text:'',enemyQty:0,enemyName:''};if(kind==='enemy'||kind==='ambush')result=dungeonEncounter(room);else if(kind==='boss')result=dungeonBossRoom(room);else{const t=kind==='trap'?(dungeonPickTrapType?.(cfg())||{name:'Piège',id:'trap'}):null;result=GensDungeonV1.exploration.buildGeneratedNonCombatRoomResult(kind,t)}try{const all=loadActiveEnemies?.()||[];all.forEach(e=>{if(Number(e.dungeonRoom||0)===Number(room)&&e.dc200Branch===undefined)e.dc200Branch=false});saveActiveEnemies?.(all)}catch(e){}const mapObj=cfg().map===false?null:generateDungeonMap(kind,result.enemyQty||0);return {result,map:mapObj}}"""
if index.count(old_create)!=1:
    raise SystemExit(f"createRoom bounded replacement count={index.count(old_create)}")
index=index.replace(old_create,new_create,1)

for label,text in (("characterization",char),("guard",guard)):
    if text.count(str(OLD_SIZE))!=1 or text.count(OLD_BLOB)!=1:
        raise SystemExit(f"{label} fingerprint seam mismatch")
char=char.replace(str(OLD_SIZE),str(NEW_SIZE),1).replace(OLD_BLOB,NEW_BLOB,1)
guard=guard.replace(str(OLD_SIZE),str(NEW_SIZE),1).replace(OLD_BLOB,NEW_BLOB,1)

char_old="""assert.doesNotMatch(createSource,/GensDungeonV1\\.exploration\\./,
  'materialization remains unextracted during the characterization lot');"""
char_new="""assert.equal((createSource.match(/GensDungeonV1\\.exploration\\.buildGeneratedNonCombatRoomResult\\(/g)||[]).length,1,
  'createRoom must delegate only non-combat result construction after the isolated raccord');"""
if char.count(char_old)!=1:
    raise SystemExit(f"characterization ownership seam count={char.count(char_old)}")
char=char.replace(char_old,char_new,1)

vm_old="""vm.createContext(sandbox);
vm.runInContext(createSource+';this.createRoom=createRoom;',sandbox,{filename:'dungeonCore200Rebuild.createRoom.js'});"""
vm_new="""vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(createSource+';this.createRoom=createRoom;',sandbox,{filename:'dungeonCore200Rebuild.createRoom.js'});"""
if char.count(vm_old)!=1:
    raise SystemExit(f"characterization VM seam count={char.count(vm_old)}")
char=char.replace(vm_old,vm_new,1)
char=char.replace(
    "decision:'characterize before selecting one pure extraction seam'",
    "decision:'non-combat result descriptors delegated; active materialization remains Core 2.00'",
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

print("Phase 7 lot 31 bounded runtime patch GREEN locally; historical fingerprints deferred to full CI")
