from pathlib import Path
import hashlib, json

OLD_BLOB="26421e0347305437fe2b1dc149b3e4fb8b3761bd"
NEW_BLOB="18627cc0c5fc7945732c8a910504c59ef823b6ae"
OLD_SIZE=8165823
NEW_SIZE=8165398

def git_blob(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

def substitute(text,old,new,count=1,tag=""):
    actual=text.count(old)
    assert actual==count, f"{tag or old[:60]}: expected {count}, got {actual}"
    return text.replace(old,new,count)

index_path=Path("index.html")
raw=index_path.read_bytes()
assert len(raw)==OLD_SIZE and git_blob(raw)==OLD_BLOB,"Rule 26 original index mismatch"
old_index=raw.decode("utf8")

old_load='<script src="assets/gensrpg/capture/screen-return-v1.js?v=1"></script>'
new_load=old_load+'\n<script src="assets/gensrpg/capture/hub-entry-v1.js?v=1"></script>'
old_method='''window.captureEnterWorld139=function(){
  try{closeTurnPopup(false)}catch(e){}
  ["pregameSetup","sessionHeroSetup","sessionObjectSetup","sessionWaveSetup","sessionDungeonSetup","sheet","setup"].forEach(id=>{
    const e=document.getElementById(id);if(e)e.style.setProperty("display","none","important");
  });
  const menu=document.getElementById("menu");
  if(menu)menu.style.setProperty("display","block","important");
  try{renderMenuStatuses()}catch(e){}
  try{renderCaptureWorldHub()}catch(e){}
  const hub=document.getElementById("captureGameHub");
  if(hub){
    hub.style.setProperty("display","block","important");
    requestAnimationFrame(()=>hub.scrollIntoView({block:"start",behavior:"auto"}));
  }
};'''
new_install='''window.GensCaptureHubEntryV1.install({
  closeTurnPopup:()=>closeTurnPopup(false),
  renderMenuStatuses:()=>renderMenuStatuses(),
  renderCaptureWorldHub:()=>renderCaptureWorldHub()
});'''
old_bind='enterWorld:()=>captureEnterWorld139()'
new_bind='enterWorld:()=>window.GensCaptureHubEntryV1.enterWorld()'
index=substitute(old_index,old_load,new_load,1,"load")
index=substitute(index,old_method,new_install,1,"legacy method")
index=substitute(index,old_bind,new_bind,2,"consumers")
updated=index.encode("utf8")
assert len(updated)==NEW_SIZE and git_blob(updated)==NEW_BLOB,"unexpected transfer result"
reverted=index.replace(new_bind,old_bind).replace(new_install,old_method,1).replace(new_load,old_load,1)
assert reverted==old_index,"not byte-exact rollback"
index_path.write_bytes(updated)

# The historic characterization is not weakened: reconstruct the exact historic
# source and run its original assertions/VM against the hash-verified baseline.
historic=Path("tests/gens_phase9_capture_hub_world_owner_characterization_v1.test.cjs")
s=historic.read_text(encoding="utf8")
orig="const bytes=fs.readFileSync(path.join(root,'index.html'));"
new="""const activeBytes=fs.readFileSync(path.join(root,'index.html'));
const active=activeBytes.toString('utf8');
const indexBlob=buf=>crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\\\\0')).update(buf).digest('hex');
assert.equal(activeBytes.length,"""+str(NEW_SIZE)+""");
assert.equal(indexBlob(activeBytes),'"""+NEW_BLOB+"""');
const oldLoad="""+json.dumps(old_load,ensure_ascii=False)+""";
const newLoad="""+json.dumps(new_load,ensure_ascii=False)+""";
const oldMethod="""+json.dumps(old_method,ensure_ascii=False)+""";
const newInstall="""+json.dumps(new_install,ensure_ascii=False)+""";
const oldBind="""+json.dumps(old_bind,ensure_ascii=False)+""";
const newBind="""+json.dumps(new_bind,ensure_ascii=False)+""";
assert.equal(active.split(newLoad).length-1,1);
assert.equal(active.split(newInstall).length-1,1);
assert.equal(active.split(newBind).length-1,2);
const restored=active.replace(newBind,oldBind).replace(newBind,oldBind)
  .replace(newInstall,oldMethod).replace(newLoad,oldLoad);
const bytes=Buffer.from(restored,'utf8');"""
# JavaScript "\0" source correctly needs a single escaped slash in the JS literal
new=new.replace("buf.length+'\\\\0'","buf.length+'\\0'")
s=substitute(s,orig,new,1,"historical VM fixture")
historic.write_text(s,encoding="utf8",newline="")

# The cumulative Dungeon rollback now first reverses Hub entry, before
# the older Capture screen-return/session and Survival seams.
p=Path("tests/gens_phase9_capture_dungeon_setup_entry_owner_transfer_v1.test.cjs")
s=p.read_text(encoding="utf8")
anchor="const beforeReturnOwner=index.replace(captureReturnLoadNew,captureReturnLoadOld).replace(captureReturnSeamNew,captureReturnSeamOld);"
insert="""const hubEntryLoadOld="""+json.dumps(old_load,ensure_ascii=False)+""";
const hubEntryLoadNew="""+json.dumps(new_load,ensure_ascii=False)+""";
const hubEntrySeamOld="""+json.dumps(old_method,ensure_ascii=False)+""";
const hubEntrySeamNew="""+json.dumps(new_install,ensure_ascii=False)+""";
const hubEntryBindOld="""+json.dumps(old_bind,ensure_ascii=False)+""";
const hubEntryBindNew="""+json.dumps(new_bind,ensure_ascii=False)+""";
assert.equal(index.split(hubEntryLoadNew).length-1,1,'one Hub owner script load');
assert.equal(index.split(hubEntrySeamNew).length-1,1,'one Hub owner install');
assert.equal(index.split(hubEntryBindNew).length-1,2,'both Capture owners use dedicated hub');
const beforeHubEntry=index.replace(hubEntryBindNew,hubEntryBindOld)
  .replace(hubEntryBindNew,hubEntryBindOld)
  .replace(hubEntrySeamNew,hubEntrySeamOld)
  .replace(hubEntryLoadNew,hubEntryLoadOld);
const restoredHubBytes=Buffer.from(beforeHubEntry,'utf8');
const restoredHubBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+restoredHubBytes.length+'\\\\0'),restoredHubBytes
])).digest('hex');
assert.equal(restoredHubBlob,'"""+OLD_BLOB+"""','before cumulative rollback, undo Hub owner exactly');
assert.equal(beforeHubEntry.split(captureReturnLoadNew).length-1,1,'Capture return script load preserved in rollback');
assert.equal(beforeHubEntry.split(captureReturnSeamNew).length-1,1,'Capture return dependency preserved in rollback');
const beforeReturnOwner=beforeHubEntry.replace(captureReturnLoadNew,captureReturnLoadOld).replace(captureReturnSeamNew,captureReturnSeamOld);"""
insert=insert.replace("restoredHubBytes.length+'\\\\0'","restoredHubBytes.length+'\\0'")
s=substitute(s,anchor,insert,1,"cumulative rollback")
s=substitute(s,"assert.equal(index.split(captureReturnSeamNew).length-1,1,'exactly one current Capture return-owner binding seam');","",1,"move pre-migration guard after rollback")
p.write_text(s,encoding="utf8",newline="")

# Existing tests keep guards, updated for the now canonical owner.
patches={
"tests/gens_phase9_capture_screen_return_owner_transfer_v1.test.cjs":[
 ("assert.match(legacy,/enterWorld:\\(\\)=>captureEnterWorld139\\(\\)/);",
  "assert.match(legacy,/enterWorld:\\(\\)=>window\\.GensCaptureHubEntryV1\\.enterWorld\\(\\)/);"),
 ("assert.match(legacy,/window\\.captureEnterWorld139=function\\(\\)/,",
  "assert.match(legacy,/GensCaptureHubEntryV1\\.install\\(\\{/,"),
 ("'Hub renderer remains unchanged in this single-responsibility lot');",
  "'Capture139 must wire, not own, the dedicated Hub entry; world renderer remains unchanged');")],
"tests/gens_phase9_capture_screen_return_ownership_preaudit_v1.test.cjs":[
 ("assert.match(capture,/captureEnterWorld139\\(\\)/,",
  "assert.match(capture,/GensCaptureHubEntryV1\\.enterWorld\\(\\)/,"),
 ("'Capture139 remains the physical owner of the Capture hub/world transition');",
  "'Capture139 delegates the Hub transition to the unique physical Capture Hub owner');")],
"tests/gens_phase5_module_screen_return_capture_raccord_v1.test.cjs":[
 ("assert.match(capture,/captureEnterWorld139\\(\\)/,",
  "assert.match(capture,/GensCaptureHubEntryV1\\.enterWorld\\(\\)/,")],
"tests/gens_phase5_gomenu_core01_retirement_v1.test.cjs":[
 ("assert.match(capture139,/enterWorld:\\(\\)=>captureEnterWorld139\\(\\)/,",
  "assert.match(capture139,/enterWorld:\\(\\)=>window\\.GensCaptureHubEntryV1\\.enterWorld\\(\\)/,")]
}
for path,rewrites in patches.items():
    p=Path(path);s=p.read_text(encoding="utf8")
    for a,b in rewrites:s=substitute(s,a,b,1,path)
    p.write_text(s,encoding="utf8",newline="")

# Update exact current-index fingerprint assertions in all other tests.
for p in sorted(Path("tests").rglob("*.test.cjs")):
    if p.name in ["gens_phase9_capture_hub_world_owner_characterization_v1.test.cjs",
      "gens_phase9_capture_hub_entry_owner_transfer_v1.test.cjs"]:continue
    old=p.read_text(encoding="utf8")
    new=old.replace(OLD_BLOB,NEW_BLOB).replace(str(OLD_SIZE),str(NEW_SIZE))
    new=new.replace("productionOwnerGraph:85","productionOwnerGraph:86").replace("captureAuxiliaryRuntimeOwners:2","captureAuxiliaryRuntimeOwners:3")
    if new!=old:p.write_text(new,encoding="utf8",newline="")

p=Path("docs/GENSRPG_PHASE2_INLINE_OWNERS.json")
s=p.read_text(encoding="utf8")
s=substitute(s,OLD_BLOB,NEW_BLOB,1,"Phase2 inline cartography")
p.write_text(s,encoding="utf8",newline="")

p=Path("docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json")
data=json.loads(p.read_text(encoding="utf8"))
assert len(data["files"])==85,"unexpected production owner graph"
entry="assets/gensrpg/capture/hub-entry-v1.js"
assert entry not in data["files"]
data["files"][entry]={"owner":"GenSrpG Capture Hub Entry","domain":"capture","role":"active Phase 9 unique UI transition owner for Capture Hub, injected legacy rendering dependencies, no Shell or world-data ownership"}
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf8",newline="")

p=Path("tests/gens_phase3_target_structure_contracts_v1.test.cjs")
s=p.read_text(encoding="utf8")
s=substitute(s,"Object.keys(ownerManifest.files||{}).length,85","Object.keys(ownerManifest.files||{}).length,86",1)
s=s.replace("Phase 9 registers two Capture auxiliary runtime owners (session start and screen return)",
  "Phase 9 registers three Capture auxiliary runtime owners (session, return and Hub UI)")
p.write_text(s,encoding="utf8",newline="")

# All tests still have to pass; do not remove any sentinel to force GREEN.
print("verified migrated runtime",len(updated),git_blob(updated))
print("verified retained legacy rollback",len(reverted.encode()),git_blob(reverted.encode()))
